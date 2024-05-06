const GitvRef = require("./GitvRef");
const utils = require("./Utils");

class GitvBranch {
    constructor(branchName, options) {
        this.branchName = branchName;
        this.options = options;
        this.ref = new GitvRef();
    }

    async branch() {
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository"); 
        console.log(`git branch execute ${this.branchName}----${JSON.stringify(this.options)}`);
        const gitvBranchActions = {
            getLocalBranches: async () => await this.getLocalBranches(),
            getRemoteBranches: () => this.getRemoteBranches(),
            getALLBranches: () => this.getAllBranches(),
            addBranch: (branchName) => this.addBranch(branchName),
            deleteBranch: (branchName) => this.deleteBranch(branchName),
            renameBranch: (branchName, newBranch) => this.renameBranch(branchName, newBranch),
        };
        const action = this.options.delete ? 'deleteBranch' : this.options.move ? 'renameBranch' : this.options.all ? 'getAllBranches' : this.options.remote ? 'getRemoteBranches' : !this.branchName && Object.keys(this.options).length === 0 ? 'getLocalBranches' : this.branchName && Object.keys(this.options).length === 0 ? "addBranch" : null;
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

    async getLocalBranches() {
        await this.ref.localHeads()
    }

    async getRemoteBranches() {
        await this.ref.remotesHeads()
    }

    async getAllBranches() {
        await this.getLocalBranches()
        await this.getRemoteBranches()
    }

    async addBranch(branchName) {
        await this.ref.createRef(branchName);
    }

    async deleteBranch(branchName) {
        await this.ref.deleteRef(branchName);
    }
}

module.exports = GitvBranch;