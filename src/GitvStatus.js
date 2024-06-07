const fs = require('fs');
const path = require('path');
const utils = require('./Utils');
const index = require('./GitvIndex');
const GitvRef = require('./GitvRef');
const Commit = require('./Commit');

class GitvStatus {
  constructor() {
    this.gitvRepoPath = utils.getResourcePath();
    // HEAD文件的路径
    this.headFilePath = path.join(this.gitvRepoPath, 'HEAD');
    this.ref = new GitvRef();
  }
  static get FILE_STATUS() {
    return {
      ADD: "add",
      MODIFY: "modify",
      DELETE: "delete",
      SAME: "same",
      CONFLICT: "conflict"
    };
  }
  async status() {
    console.log("gitv statusfffff");
    // 必须是Gitv仓库
    if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
    // 不能是裸仓库
    if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
    const headDesc = await this.getHeadDesc();
    // console.log(branchName, "--------------------------------------------------------------------branchName");
    // await this.untracked();
    // await this.deleted();
    // const fileConflicts = await this.conflictedFilePaths(2);
    // console.log(fileConflicts, "----------------------------------------");

    await this.toBeCommitted();
    var modifiedKeys = await this.modified();
    console.log(["On branch " + headDesc,
      utils.addDesc("Untracked files:", await this.untracked()),
      utils.addDesc("Unmerged paths:", await this.conflictedFilePaths()),
      utils.addDesc("Changes to be committed:", await this.toBeCommitted()),
      utils.addDesc("files to be deleted:", await this.deleted())
    ].flat(Infinity).join("\n"));
  }


  async modified() {
    const workToc = await this.workingCopyToc();
    const idx = await index.read();
    const indexToc = utils.convertObject(idx);
    const modifiedKeys = [];

    for (let key in indexToc) {
      if (indexToc.hasOwnProperty(key)) {
        // 检查 workToc 对象中是否存在该键  
        if (!workToc.hasOwnProperty(key) || indexToc[key] !== workToc[key]) {
          // 如果不存在或者值不同，则添加到数组中  
          modifiedKeys.push(key);
        }
      }
    }
    return modifiedKeys;
  };

  async getHeadDesc() {
    try {
      // 获取当前 HEAD 的描述信息。
      let headDesc = await this.ref.headBranchName();

      // 如果 HEAD 处于分离状态，返回 "HEAD detached from ..."。
      if (this.ref.isHeadDetached()) {
        return `HEAD detached from ${headDesc.slice(6)}`;
      } else {
        return `On branch ${headDesc}`; // 如果 HEAD 在某个分支上，返回 "On branch ... "。
      }
    } catch (error) {
      // 捕获并处理可能的错误
      console.error("An error occurred while getting the head description:", error);
      return "An error occurred while getting the head description.";
    }
  }


  async untracked() {
    const workingFiles = [];
    await utils.readAllFilesInDirectory(this.gitvRepoPath, (name, content, resolvedPath) => {
      if (!resolvedPath.startsWith(path.join(this.gitvRepoPath, ".gitv"))) {
        workingFiles.push(path.relative(this.gitvRepoPath, resolvedPath));
      }
    })

    const idx = await index.read();
    workingFiles.filter(file => !utils.convertObject(idx).hasOwnProperty(file));
    return workingFiles;
  }

  async deleted() {
    const workingFiles = [];
    await utils.readAllFilesInDirectory(this.gitvRepoPath, (name, content, resolvedPath) => {
      if (!resolvedPath.startsWith(path.join(this.gitvRepoPath, ".gitv"))) {
        workingFiles.push(path.relative(this.gitvRepoPath, resolvedPath));
      }
    })

    const idx = await index.read();
    return Object.keys(utils.convertObject(idx)).filter(key => !workingFiles.includes(key));
  }

  read(path) {
    if (fs.existsSync(path)) {
      return fs.readFileSync(path, "utf8");
    }
  }

  async workingCopyToc() {
    // 读取 Git 索引，提取并过滤出存在于工作目录中的文件路径  
    const tocObj = (await index.read())
      .keys() // 获取索引中的所有键  
      .map(key => key.split(",")[0]) // 提取文件路径  
      .filter(path => fs.existsSync(path.join(utils.getGivWorkingDirRoot(), path))) // 过滤存在文件  
      .reduce((obj, path) => {
        const filePath = path.join(utils.getGivWorkingDirRoot(), path);
        const blobHash = utils.sha1(utils.createGitBlob(filePath));
        obj[path] = blobHash;
        return obj;
      }, {});
    // 返回包含文件路径和哈希的对象  
    return tocObj;
  }

  async conflictedFilePaths(stageNumber) {
    const idx = await index.read();
    return Object.keys(idx)
      .filter(key => {
        const parts = key.split(',');
        return parts[1] && parseInt(parts[1], 10) === stageNumber;
      })
      .map(key => key.split(',')[0]);
  };

  async toBeCommitted() {
    const commit = new Commit();
    const currentCommitId = this.ref.getBranchHash(this.headFilePath);
    const treeHash = commit.readCommit(currentCommitId);
    const treeContent = await utils.readObject(treeHash);
    const treeObjects = await utils.fileTree(treeHash);
    const nestedTree = utils.flattenNestedTree(treeObjects);
    const idx = await index.read();
    const idxWidthOutStageNumber = utils.convertObject(idx);
    const aaa = this.diffTwoTocs(nestedTree, idxWidthOutStageNumber);
    return aaa;
  }

  fileStatus(receiver, giver, base) {
    var receiverPresent = receiver !== undefined;
    var basePresent = base !== undefined;
    var giverPresent = giver !== undefined;

    if (receiverPresent && giverPresent && receiver !== giver) {
      if (receiver !== base && giver !== base) {
        return GitvStatus.FILE_STATUS.CONFLICT;
      } else {
        return GitvStatus.FILE_STATUS.MODIFY;
      }
    } else if (receiver === giver) {
      return GitvStatus.FILE_STATUS.SAME;
    } else if ((!receiverPresent && !basePresent && giverPresent) ||
      (receiverPresent && !basePresent && !giverPresent)) {
      return GitvStatus.FILE_STATUS.ADD;
    } else if ((receiverPresent && basePresent && !giverPresent) ||
      (!receiverPresent && basePresent && giverPresent)) {
      return GitvStatus.FILE_STATUS.DELETE;
    }
  };

  diffTwoTocs(receiver, giver, base) {
    const self = this;
    base = base || receiver;
    const paths = Object.keys(receiver).concat(Object.keys(base)).concat(Object.keys(giver));
    return [...new Set(paths)].reduce((idx, p) => {
      return utils.setIn(idx, [p, {
        status: self.fileStatus(receiver[p], giver[p], base[p]),
        receiver: receiver[p],
        base: base[p],
        giver: giver[p]
      }]);
    }, {});
  }

  // **toBeCommitted()** returns an array of lines listing the files
  // that have changes that will be included in the next commit.
  // toBeCommitted() {
  //     var headHash = refs.hash("HEAD");
  //     var headToc = headHash === undefined ? {} : objects.commitToc(headHash);
  //     var ns = diff.nameStatus(diff.tocDiff(headToc, index.toc()));
  //     return Object.keys(ns).map(function(p) { return ns[p] + " " + p; });
  // };

  // **notStagedForCommit()** returns an array of lines listing the
  // files that have changes that will not be included in the next
  // commit.
  notStagedForCommit() {
    var ns = diff.nameStatus(diff.diff());
    return Object.keys(ns).map(function (p) {
      return ns[p] + " " + p;
    });
  };
}

module.exports = GitvStatus;