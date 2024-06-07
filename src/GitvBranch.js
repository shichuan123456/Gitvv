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
        // 定义Gitv分支操作的对象，包含不同的分支操作函数  
        const gitvBranchActions = {
            // 获取本地所有分支  
            getLocalBranches: async () => await this.getLocalBranches(),
            // 获取远程所有分支  
            getRemoteBranches: () => this.getRemoteBranches(),
            // 获取所有分支（本地和远程）  
            getBranches: () => this.getBranches(),
            // 添加一个新分支  
            addBranch: (branchName) => this.addBranch(branchName),
            // 删除一个分支  
            deleteBranch: (branchName) => this.deleteBranch(branchName),
            // 重命名一个分支  
            renameBranch: (branchName, newBranch) => this.renameBranch(branchName, newBranch),
        };
        // 根据传入的选项确定要执行的操作  
        let action = this.options.delete ? 'deleteBranch' :
            this.options.move ? 'renameBranch' :
            this.options.all ? 'getBranches' :
            this.options.remote ? 'getRemoteBranches' :
            !this.branchName && Object.keys(this.options).length === 0 ? 'getLocalBranches' :
            this.branchName && Object.keys(this.options).length === 0 ? "addBranch" : null;
        // 如果确定了操作，则执行对应的操作  
        if (action) {
            // 对于重命名分支的操作，如果未提供新的分支名，则打印错误信息并退出  
            if (action === 'renameBranch' && !this.options.move) {
                console.error('Invalid command: Please provide a new branch name for rename');
                return;
            }

            // 调用对应的分支操作函数，根据操作类型传入不同的参数  
            // 执行相应的操作  
            gitvBranchActions[action](...(action === 'renameBranch' ? [this.branchName, this.options.move] : [this.branchName]));

        } else {
            // 如果没有确定的操作，则打印错误信息  
            console.error('Invalid command: Please provide a valid git branch command');
        }
    }

    async getLocalBranches() {
        await this.ref.localHeads()
    }

    async getRemoteBranches() {
        try {
            await this.ref.remotesHeads();
        } catch (err) {
            throw err;
        }
    }

    async getAllBranches() {
        try {
            await this.getLocalBranches()
            await this.getRemoteBranches()
        } catch (err) {
            throw err;
        }
    }

    async addBranch(branchName) {
        try {
            if(this.ref.isExistRef(this.branchName)) {
                console.error(`a branch named ${branchName} already exists`)
                return false;
            }
            await this.ref.createRef(branchName)
        } catch (error) {
            throw error
        }
    }

    async deleteBranch(branchName) {
        try {
            await this.ref.deleteRef(branchName);
        } catch(error) {
            throw error
        } 
    }

    async renameBranch(branchName, newBranch) {
        try {
            await this.ref.renameRef(branchName, newBranch);
        } catch(error) {
            throw error
        } 
    }
}

module.exports = GitvBranch;