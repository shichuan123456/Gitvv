const GitvInit = require("./GitvInit")
const GitvAdd = require("./GitvAdd")
const GitvCommit = require("./GitvCommit");
const GitvClone = require("./GitvClone");
const GitvBranch = require("./GitvBranch");
const GitvRemote = require("./GitvRemote");
class Gitv {
  constructor() {}
  init(directoryTarget, options) {
    // 初始化GitvInit实例
    this.gitvInit = new GitvInit(directoryTarget, options)
    // 调用init方法实现初始化功能
    this.gitvInit.init();
  }

  add(pathOrfiles) {
    // 初始化GitvAdd实例
    this.gitvAdd = new GitvAdd(pathOrfiles)
    this.gitvAdd.add();
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
    this.gitvBranch = new GitvBranch(branchName, options)
    this.gitvBranch.branch();
  }

  remote(url, options) {
    this.gitvRemote = new GitvRemote(url, options)
    this.gitvRemote.remote();
  }
}

module.exports = Gitv;