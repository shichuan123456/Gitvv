const utils = require("./Utils");
const GitvConfig = require("./GitvConfig");
const fs = require("fs");

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
            getRemoteNames: async () => this.displayRemoteNames(),
            getRemoteDetails: () => this.getRemoteDetails(),
            addNewRemote: (remoteName, url) => this.addNewRemote(remoteName, url),
            removeRemote: (remoteName) => this.removeRemote(remoteName),
            setRemote: (remoteName, url) => this.setRemote(remoteName, url),
            renameRemote: (oldName, newName) => this.renameRemote(oldName, newName),
        };

        const action = this.options.add ? 'addNewRemote' : this.options.remove ? 'removeRemote' : this.options.setUrl ? 'setRemote' : this.options.rename ? 'renameRemote' : this.options.verbose ? 'getRemoteDetails' : !this.url && Object.keys(this.options).length === 0 ? 'getRemoteNames' : null;
        if (action) {
            // if (action === 'renameBranch' && !this.options.newBranch) {
            //     console.error('Invalid command: Please provide a new branch name for rename');
            //     return;
            // }
            // 执行相应的操作 
            // gitvRemoteActions[action](...(action === 'renameBranch' ? [this.branchName, this.options.newBranch] : [this.branchName]));
            gitvRemoteActions[action](this.options, this.url);
        } else {
            console.error('Invalid command: Please provide a valid git branch command');
        }

    }

    getRemoteNames() {
        const config = this.config.read()
        console.log(config, "---------------------------------------=============-----------------=======");
        // 确保config对象存在且包含remote属性
        if (config && config.remote) {
            // 使用Object.keys()获取remote对象下的所有键  
            return Object.keys(config.remote);
        } else {
            return [];
        }
    }

    displayRemoteNames() {
        const remoteNames = this.getRemoteNames();
        remoteNames.forEach(remoteName => {
            console.log(remoteName);
        });
    }

    getRemoteDetails() {
        const config = this.config.read()
        // 确保config对象存在且包含remote属性
        if (config && config.remote) {
            // 使用Object.keys()获取remote对象下的所有键  
            let output = '';
            const remotesConfig = config.remote
            for (const remoteName in remotesConfig) {
                const remoteInfo = remotesConfig[remoteName];
                const fetchUrl = remoteInfo.url; // 通常用于fetch操作  
                const pushUrl = remoteInfo.pushurl || fetchUrl; // 如果没有指定pushurl，则使用fetchUrl  
                output += `${remoteName}\t${fetchUrl} (fetch)\n`;
                output += `${remoteName}\t${pushUrl} (push)\n`;
            }
            console.log(output);
        }
    }

    isRemoteRepositoryExists(name) {
        const remoteNames = this.getRemoteNames();
        return remoteNames.includes(name);
    }

    addNewRemote({
        add: remoteName
    }, url) {
        if (this.isRemoteRepositoryExists(remoteName)) {
            console.log(`error: remote origin already exists.`);
            return;
        }
        const config = this.config.read();
        const newRemoteObj = {
            url,
            fetch: `+refs/heads/*:refs/remotes/${remoteName}/*`
        }
        config.remote[`${remoteName}`] = newRemoteObj;
        // TODO objToGitConfigString方法有问题需要修改
        fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
    }

    removeRemote({
        remove: remoteName
    }) {
        if (!this.isRemoteRepositoryExists(remoteName)) {
            console.log(`error: No such remote: 'origin-test'`);
            return;
        }
        const config = this.config.read();
        delete config.remote[`${remoteName}`];
        fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
    }

    setRemote({
        setUrl: remoteName
    }, url) {
        {
            if (!this.isRemoteRepositoryExists(remoteName)) {
                console.error(`error: No such remote ${remoteName}`);
                return;
            }
            const config = this.config.read();
            config.remote[`${remoteName}`].url = url;
            fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
        }
    }

    renameRemote ({rename: oldName}, newName) {
        if (!this.isRemoteRepositoryExists(oldName)) {
            console.error(`error: No such remote ${oldName}`);
            return;
        }
        if (!this.isRemoteRepositoryExists(newName)) {
            console.error(`error: remote origin already exists.`);
            return;
        }
        const config = this.config.read();
        const content = config.remote[`${remoteName}`].url;
        delete config.remote[`${remoteName}`].url;
        config.remote[`${newName}`]  = content;
        fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
    }
}

module.exports = GitvRemote;