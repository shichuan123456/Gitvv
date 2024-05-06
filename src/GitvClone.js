const utils = require("./Utils")
const path = require("path")
const fs = require("fs")


class GitvClone {
    constructor(remotePath, targetPath) {
        this.remotePath = remotePath
        this.targetPath = targetPath
    }

    clone() {
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
        // 不能是裸仓库
        if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
        opts = opts || {};

        if (!this.remotePath || !this.targetPath) {
            throw new Error("you must specify remote path and target path");
        // 被克隆的文件夹要存在，并且是gitv仓库
        } else if (!fs.existsSync(this.remotePath) || !util.onRemote(this.remotePath)(files.inRepo)) {
          throw new Error("repository " + this.remotePath + " does not exist");
    
        // 目标路径必须存在，并且要为空
        } else if (fs.existsSync(this.targetPath) && fs.readdirSync(this.targetPath).length > 0) {
          throw new Error(this.targetPath + " already exists and is not empty");
        } else {
            remotePath = path.resolve(process.cwd(), this.remotePath);

            // 目标路径不存在，就创建目录
            if (!fs.existsSync(this.targetPath)) {
              fs.mkdirSync(this.targetPath);
            }
      
            // 在目标路径进行操作
            util.onRemote(this.targetPath)(function() {
      
              // 初始化仓库
              gitlet.init(opts);
      
              // 将 remotePath 设置为名为 "origin" 的远程仓库。
              gitlet.remote("add", "origin", nodePath.relative(process.cwd(), remotePath));
      
              // 获取远程仓库上 master 分支指向的提交的哈希值。
              var remoteHeadHash = util.onRemote(remotePath)(refs.hash, "master");
      
              // 如果远程仓库有任何提交，那么该哈希值将存在。
              // 新的仓库记录了远程仓库上传递的 branch 所在的提交。
              // 然后，它将新仓库上的 master 分支指向该提交。
              if (remoteHeadHash !== undefined) {
                gitlet.fetch("origin", "master");
                merge.writeFastForwardMerge(undefined, remoteHeadHash);
              }
            });
            return "Cloning into " + targetPath;
        }
    
    }
}

module.exports = GitvClone;