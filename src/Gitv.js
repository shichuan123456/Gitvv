const GitvInit = require("./GitvInit")


const GitvAdd = require("./GitvAdd")
const GitvRm = require("./GitvRm");
const GitvBranch = require("./GitvBranch");
const GitvCommit = require("./GitvCommit");
// const GitvClone = require("./GitvClone");

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

  async rm(fileOrPath, options) {
    try {
      this.gitvRm = new GitvRm(fileOrPath, options)
      await this.gitvRm.rm()
    } catch (err) {
      throw err;
    }
  }

  async commit(options) {
    try {
      this.gitvCommit  = new GitvCommit(options)
      await this.gitvCommit.commit()
    } catch(err) {
      throw err
    }
  }

  clone(remotePath, targetPath) {
    this.gitvClone = new GitvClone(remotePath, targetPath)
    this.gitvClone.clone();
  }

  async branch(branchName, options) {
    try {
      this.gitvBranch = new GitvBranch(branchName, options)
      await this.gitvBranch.branch();
    } catch (err) {
      throw err
    }
  }

  remote(url, options) {
    try {
      this.gitvRemote = new GitvRemote(url, options)
      this.gitvRemote.remote();
    } catch (err) {
      throw err
    }
  }

  async log(options) {
    try {
      this.gitvLog = new GitvLog(options)
      await this.gitvLog.log();
    } catch (err) {
      throw err
    }
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