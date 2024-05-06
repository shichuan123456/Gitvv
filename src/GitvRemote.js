const utils = require("./Utils");
const GitvConfig = require("./GitvConfig");

class GitvRemote {
    constructor(url, options) {
        this.url = url;
        this.options = options;
        this.config = new GitvConfig();
    }

    async remote() {
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository"); 
        console.log(`gitv remote execute ${this.url}----${JSON.stringify(this.options)}`);
        const gitvRemoteActions = {
            getRemoteNames: async () =>  this.getRemoteNames(),
            getRemoteDetails: () => this.getRemoteDetails(),
            addNewRemote: () => this.addNewRemote(),
            removeRemote: (remoteName) => this.removeRemote(remoteName),
            setRemote: (remoteName, url) => this.setRemote(remoteName, url),
            renameRemote: (remoteName) => this.renameRemote(branchName, newBranch),
        };

        const action = this.options.add ? 'addNewRemote' : this.options.remove ? 'removeRemote' : this.options.setRemote ? 'setRemote' : this.options.remote ? 'getRemoteBranches' : !this.branchName && Object.keys(this.options).length === 0 ? 'getLocalBranches' : this.branchName && Object.keys(this.options).length === 0 ? "addBranch" : null;
        if (action) {
            if (action === 'renameBranch' && !this.options.newBranch) {
                console.error('Invalid command: Please provide a new branch name for rename');
                return;
            }
            // 执行相应的操作 
            gitvBranchActions[action](...(action === 'renameBranch' ? [this.branchName, this.options.newBranch] : [this.branchName]));
        } else {
            console.error('Invalid command: Please provide a valid git branch command');
        }

    }

    getRemoteNames(config) {
        const config = this.config.read()
        // 确保config对象存在且包含remote属性
        if (config && config.remote) {  
          // 使用Object.keys()获取remote对象下的所有键  
          return Object.keys(config.remote);  
        } else {
          // 如果config或config.remote不存在，返回一个空数组  
          return [];  
        }
    }
}

module.exports = GitvRemote;