const utils = require("./Utils");
const GitvConfig = require("./GitvConfig");

class GitvLog {
    constructor(options) {
        this.options = options;
    }

    async log() {
        console.log('log', this.options)
        // 必须是Gitv仓库
        // if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
        // console.log(`gitv remote execute ${this.url}----${JSON.stringify(this.options)}`);
        // const gitvRemoteActions = {
        //     getRemoteNames: async () => this.displayRemoteNames(),
        //     getRemoteDetails: () => this.getRemoteDetails(),
        //     addNewRemote: (remoteName, url) => this.addNewRemote(remoteName, url),
        //     removeRemote: (remoteName) => this.removeRemote(remoteName),
        //     setRemote: (remoteName, url) => this.setRemote(remoteName, url),
        //     renameRemote: (oldName, newName) => this.renameRemote(oldName, newName),
        // };

        // const action = this.options.add ? 'addNewRemote' : this.options.remove ? 'removeRemote' : this.options.setUrl ? 'setRemote' : this.options.rename ? 'renameRemote' : this.options.verbose ? 'getRemoteDetails' : !this.url && Object.keys(this.options).length === 0 ? 'getRemoteNames' : null;
        // if (action) {
        //     // if (action === 'renameBranch' && !this.options.newBranch) {
        //     //     console.error('Invalid command: Please provide a new branch name for rename');
        //     //     return;
        //     // }
        //     // 执行相应的操作 
        //     // gitvRemoteActions[action](...(action === 'renameBranch' ? [this.branchName, this.options.newBranch] : [this.branchName]));
        //     gitvRemoteActions[action](this.options, this.url);
        // } else {
        //     console.error('Invalid command: Please provide a valid git branch command');
        // }

    }
}

module.exports = GitvLog;