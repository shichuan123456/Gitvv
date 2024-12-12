const GitvInit = require("./GitvInit")


// const GitvAdd = require("./GitvAdd")
// const GitvRm = require("./GitvRm");
// const GitvCommit = require("./GitvCommit");
// const GitvClone = require("./GitvClone");
// const GitvBranch = require("./GitvBranch");
// const GitvRemote = require("./GitvRemote");
// const GitvLog = require("./GitvLog");
// const GitvStatus = require("./GitvStatus");
// const GitvMerge = require("./GitvMerge");

class Gitv {
  constructor() {}
  async init(directoryTarget, options) {
    try {
      // 初始化GitvInit实例
      this.gitvInit = new GitvInit(directoryTarget, options)
      // 调用init方法实现初始化功能
      await this.gitvInit.init();
    } catch (err) {
      throw err;
    }
  }

  async add(pathOrfile) {
    try {
      this.gitvAdd = new GitvAdd(pathOrfile)
      await this.gitvAdd.add();
    } catch (err) {
      throw err;
    }
  }

  rm(fileOrPath, options) {
    try {
      this.gitvRm = new GitvRm(fileOrPath, options)
      this.gitvRm.gitRm()
    } catch (err) {
      throw err;
    }
  }

  commit(options) {
    this.gitvCommit = new GitvCommit(options)
    this.gitvCommit.commit();
  }

  clone(remotePath, targetPath) {
    this.gitvClone = new GitvClone(remotePath, targetPath)
    this.gitvClone.clone();
  }

  branch(branchName, options) {
    try {
      this.gitvBranch = new GitvBranch(branchName, options)
      this.gitvBranch.branch();
    } catch (err) {
      throw error
    }
  }

  remote(url, options) {
    this.gitvRemote = new GitvRemote(url, options)
    this.gitvRemote.remote();
  }

  log(options) {
    this.gitvLog = new GitvLog(options)
    this.gitvLog.log();
  }

  status(options) {
    this.gitvStatus = new GitvStatus(options)
    this.gitvStatus.status();
  }

  merge(branch) {
    try {
      this.gitvMerge = new GitvMerge(branch)
      this.gitvMerge.merge(branch)
    } catch (error) {
      throw error
    }
  }
}

module.exports = Gitv;