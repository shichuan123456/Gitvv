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
            addNewRemote: (remoteName, url) => this.manageRemote('add', {
                remoteName
            }, url),
            removeRemote: (remoteName) => this.manageRemote('remove', {
                remoteName
            }),
            setRemote: (remoteName, url) => this.manageRemote('set', {
                remoteName
            }, url),
            renameRemote: (remoteName, newName) => this.manageRemote('rename', {
                remoteName
            }, newName),
        };

        const action = this.options.add ? 'addNewRemote' : this.options.remove ? 'removeRemote' : this.options.setUrl ? 'setRemote' : this.options.rename ? 'renameRemote' : this.options.verbose ? 'getRemoteDetails' : !this.url && Object.keys(this.options).length === 0 ? 'getRemoteNames' : null;
        if (action) {
            gitvRemoteActions[action](this.options, this.url);
        } else {
            throw new Error('Invalid command: Please provide a valid git branch command');
        }
    }

    getRemoteNames() {
        try {
            const config = this.config.read()
            // 确保config对象存在且包含remote属性
            if (config && config.remote) {
                // 使用Object.keys()获取remote对象下的所有键  
                return Object.keys(config.remote);
            } else {
                return [];
            }
        } catch (err) {
            throw err
        }
    }

    displayRemoteNames() {
        const remoteNames = this.getRemoteNames();
        remoteNames.forEach(remoteName => {
            console.log(remoteName);
        });
    }

    getRemoteDetails() {
        try {
            const config = this.config.read()
            if (config && config.remote) {
                return config.remote;
            } else {
                return {};
            }
        } catch (err) {
            throw err
        }
    }

    displayRemoteDetails() {
        try {
            const remotesConfig = this.getRemoteDetails()
            let output = '';
            for (const remoteName in remotesConfig) {
                const remoteInfo = remotesConfig[remoteName];
                const fetchUrl = remoteInfo.url; // 通常用于fetch操作  
                const pushUrl = remoteInfo.pushurl || fetchUrl; // 如果没有指定pushurl，则使用fetchUrl  
                output += `${remoteName}\t${fetchUrl} (fetch)\n`;
                output += `${remoteName}\t${pushUrl} (push)\n`;
            }
            console.log(output);
        } catch (err) {
            throw err;
        }
    }

    isRemoteRepositoryExists(name) {
        try {
            const remoteNames = this.getRemoteNames();
            return remoteNames.includes(name);
        } catch (err) {
            throw err
        }
    }

    addNewRemote({
        add: remoteName
    }, url) {
        try {
            if (this.isRemoteRepositoryExists(remoteName)) {
                throw new Error(`error: remote origin already exists.`);
            }
            const config = this.config.read();
            const newRemoteObj = {
                url,
                fetch: `+refs/heads/*:refs/remotes/${remoteName}/*`
            }
            config.remote[`${remoteName}`] = newRemoteObj;
            // TODO objToGitConfigString方法有问题需要修改
            fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
        } catch (err) {
            throw err;
        }
    }

    removeRemote({
        remove: remoteName
    }) {
        try {
            if (!this.isRemoteRepositoryExists(remoteName)) {
                throw new Error(`error: No such remote: 'origin-test'`);
            }
            const config = this.config.read();
            delete config.remote[`${remoteName}`];
            fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
        } catch (err) {
            throw err;
        }
    }

    setRemote({
        setUrl: remoteName
    }, url) {
        {
            try {
                if (!this.isRemoteRepositoryExists(remoteName)) {
                    throw new Error(`error: No such remote ${remoteName}`);
                }
                const config = this.config.read();
                config.remote[`${remoteName}`].url = url;
                fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
            } catch (err) {
                throw err
            }
        }
    }

    renameRemote({
        rename: oldName
    }, newName) {
        try {
            // 检查远程仓库列表，不存在名为 oldName 的远程仓库
            if (!this.isRemoteRepositoryExists(oldName)) {
                throw new Error(`error: No such remote ${oldName} in repository`);
            }
            //检查远程仓库列表，已经存在名为 newName 的远程仓库
            if (!this.isRemoteRepositoryExists(newName)) {
                throw new Error(`error: remote origin ${newName} already exists.`);
            }
            const config = this.config.read();
            const content = config.remote[`${remoteName}`].url;
            delete config.remote[`${remoteName}`].url;
            config.remote[`${newName}`] = content;
            fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
        } catch (err) {
            throw err
        }
    }


    manageRemote(operation, {
        remoteName
    }, urlOrNewName) {
        try {
            // 确保至少提供了远程仓库名  
            if (!remoteName) {
                throw new Error('error: remoteName is required.');
            }

            const config = this.config.read();

            switch (operation) {
                case 'add':
                    // 检查远程仓库是否已经存在  
                    if (this.isRemoteRepositoryExists(remoteName)) {
                        throw new Error(`error: remote ${remoteName} already exists.`);
                    }

                    // 添加远程仓库  
                    const newRemoteObj = {
                        url,
                        fetch: `+refs/heads/*:refs/remotes/${remoteName}/*`
                    };
                    config.remote[`${remoteName}`] = newRemoteObj;
                    break;

                case 'remove':
                    // 检查远程仓库是否存在  
                    if (!this.isRemoteRepositoryExists(remoteName)) {
                        throw new Error(`error: No such remote: '${remoteName}'`);
                    }

                    // 移除远程仓库  
                    delete config.remote[`${remoteName}`];
                    break;

                case 'set':
                    // 检查远程仓库是否存在  
                    if (!this.isRemoteRepositoryExists(remoteName)) {
                        throw new Error(`error: No such remote ${remoteName}`);
                    }

                    // 设置远程仓库的URL  
                    config.remote[`${remoteName}`].url = urlOrNewName;
                    break;

                case 'rename':
                    // 检查远程仓库列表，不存在名为 oldName 的远程仓库
                    if (!this.isRemoteRepositoryExists(oldName)) {
                        throw new Error(`error: No such remote ${oldName} in repository`);
                    }
                    //检查远程仓库列表，已经存在名为 newName 的远程仓库
                    if (!this.isRemoteRepositoryExists(urlOrNewName)) {
                        throw new Error(`error: remote origin ${urlOrNewName} already exists.`);
                    }
                    const config = this.config.read();
                    const content = config.remote[`${remoteName}`].url;
                    delete config.remote[`${remoteName}`].url;
                    config.remote[`${urlOrNewName}`] = content;
                    break;
                default:
                    throw new Error('error: Unsupported operation.');
            }

            // 写入配置  
            fs.writeFileSync(utils.getResourcePath("config"), this.config.objToGitConfigString(config), "utf-8");
        } catch (err) {
            throw err;
        }
    }
}

module.exports = GitvRemote;