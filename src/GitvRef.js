const path = require('path');
const fs = require("fs")
const fsPromise = require("fs").promises;
const utils = require("./Utils");

class GitvRef {
    constructor() {
        // 本地分支目录的路径
        this.localBranchesDir = utils.getResourcePath('refs/heads');
        // 远程分支目录的路径
        this.remoteBranchesDir = utils.getResourcePath('refs/remotes');
        // HEAD文件的路径
        this.headFilePath = utils.getResourcePath('HEAD');
    }

    static headFilePath = path.join(utils.getResourcePath(), 'HEAD')

    async localHeads() {
        try {
            // 读取本地分支目录中的所有文件，并返回文件名和内容组成的对象数组  
            const fileContents = []
            await utils.readAllFilesInDirectory(this.localBranchesDir, async (name, content) => {
                fileContents.push({
                    name,
                    content
                });
            });
            await this.displayFilesAsGitBranches(fileContents, await this.headBranchName(), await this.isHeadDetached());
        } catch (err) {
            throw err; // 重新抛出错误，以便调用者可以处理它  
        }
    }

    async remotesHeads() {
        try {
            // 读取本地分支目录中的所有文件，并返回文件名和内容组成的对象数组  
            const fileContents = []
            await utils.readAllFilesInDirectory(this.remoteBranchesDir, async (name, content, filePath) => {
                if (name === 'HEAD' && content.startsWith('ref: ')) {
                    // 如果是HEAD文件且内容以ref:开头  
                    const refPath = content.substring('ref: '.length).trim();
                    // 提取ref指向的部分，例如/origin/master  
                    const refTarget = refPath.split('/').slice(2).join('/');

                    // 使用path.dirname获取文件的父级目录  
                    const parentDir = path.basename(path.dirname(filePath));
                    const headRelativePath = path.join('remotes', '/', parentDir, 'HEAD');
                    // 将refTarget作为内容，并包含HEAD文件的相对路径  
                    fileContents.push({
                        name: headRelativePath,
                        content: refTarget
                    });
                } else {
                    // 对于非HEAD文件或HEAD内容不是ref，直接包含文件名、路径和内容  
                    fileContents.push({
                        name: name,
                        content
                    });
                }
            });
            await this.displayRemotesBranches(fileContents);
        } catch (err) {
            // 捕获并处理错误  
            console.error('读取本地分支目录时发生错误:', err);
            throw err; // 重新抛出错误，以便调用者可以处理它  
        }
    }

    async isExistRef(RefName) {
        try {
            const refs = await this.localHeads();
            return refs.map(item => item.name).includes(RefName);
        } catch (err) {
            throw err;
        }
    }

    // 创建一个新的引用（分支） // TODO,要创建的分支已经存在 
    async createRef(branchName) {
        try {
            // 获取当前HEAD指向的分支名  
            const headBranchName = await this.headBranchName();

            // 初始化commitHash为当前HEAD指向的分支名，如果HEAD是分离的，则这个值就是commit的hash  
            let commitHash = headBranchName;

            // 检查当前HEAD是否处于分离状态  
            if (!(await this.isHeadDetached())) {
                // 如果不是分离状态，读取HEAD指向的分支对应的commit hash  
                commitHash = await fsPromise.readFile(path.join(this.localBranchesDir, `${headBranchName}`), 'utf8');
            }

            // 创建新的分支文件，并写入commit hash  
            await fsPromise.writeFile(path.join(this.localBranchesDir, `${branchName}`), commitHash.trim(), 'utf8');
        } catch (error) {
            throw error; // 重新抛出错误，以便上层调用者可以处理  
        }
    }

    async updateRefByBranchName(branchName, commitId) {
        try {
            // 创建新的分支文件，并写入commit hash  
            await fsPromise.writeFile(path.join(this.localBranchesDir, `${branchName}`), commitId.trim(), 'utf8');
        } catch (error) {
            throw error; // 重新抛出错误，以便上层调用者可以处理  
        }
    }

    // 异步删除引用（分支）  
    async deleteRef(branchName) {
        try {
            // 获取当前HEAD指向的分支名  
            const headBranchName = await this.headBranchName();

            // 检查当前HEAD是否处于分离状态  
            if (!(await this.isHeadDetached())) {
                // 如果不是分离状态，并且尝试删除的分支是当前检出的分支  
                if (branchName === headBranchName) {
                    // 输出错误信息，并停止执行  
                    console.error(`error: Cannot delete branch '${branchName}' because it is currently checked out.`);
                    return; // 提前返回，不执行删除操作  
                }
            }

            // 尝试删除分支文件  
            await fsPromise.unlink(path.join(this.localBranchesDir, `${branchName}`));

            // 分支删除成功  
            console.log(`Branch '${branchName}' has been deleted successfully.`);
        } catch (error) {
            // 检查是否是ENOENT错误，即文件或目录不存在  
            if (error.code === 'ENOENT') {
                console.warn(`Branch '${branchName}' does not exist, so it cannot be deleted.`);
            } else {
                throw error;
            }
        }
    }

    isHeadDetached() {
        // 读取.git/HEAD文件的内容
        const headContent = fs.readFileSync(this.headFilePath, 'utf8');
        // 直接返回是否不是以"ref: "开头，表示头指针是否分离  
        return !headContent.startsWith("ref: ");
    }

    async headBranchName() {
        // 使用fsPromise模块异步读取head文件的内容
        const headContent = await fsPromise.readFile(this.headFilePath, 'utf8');

        // 检查HEAD是否处于分离状态  
        if (!this.isHeadDetached()) {
            // 如果HEAD没有处于分离状态，使用正则表达式从headContent中提取分支名称  
            // 假设headContent的格式为"ref: refs/heads/branchName"，则匹配并返回branchName  
            return headContent.match("refs/heads/(.+)")[1];
        } else {
            // 如果HEAD处于分离状态，直接返回headContent的内容  
            // 这通常是一个指向具体提交的哈希值  
            return headContent;
        }
    }

    displayFilesAsGitBranches(filesObj, currentBranchOrHash, isHeadDetached) {
        if (isHeadDetached) console.log(`* (HEAD detached at ${currentBranchOrHash})`);
        // 遍历对象并输出分支名  
        filesObj.forEach(({
            name
        }) => {
            const isCurrent = currentBranchOrHash === name; // 判断当前文件  
            const prefix = isCurrent ? '*' : ' '; // 设置前缀，当前文件用 '*' 表示  
            console.log(`${prefix} ${name}`); // 输出文件名，前面加上前缀 
        })
    }

    displayRemotesBranches(filesObj) {
        filesObj.forEach(({
            name,
            content
        }) => {
            const isHead = name.indexOf("HEAD"); // 判断当前文件  
            if (isHead != -1) {
                console.log(`${name}  ---> ${content}`); // 输出文件名即可
            } else {
                console.log(`${name}`)
            }
        })
    }

    // 修改引用名称（分支）
    async renameRef(branchName, newBranch) {
        console.log(branchName, newBranch, "------------------------------");
        try {
            // 获取当前HEAD指向的分支名  
            const headBranchName = await this.headBranchName();

            // 检查当前HEAD是否处于分离状态  
            if (!(await this.isHeadDetached())) {
                // 如果不是分离状态，并且尝试删除的分支是当前检出的分支  
                if (branchName === headBranchName) {
                    // 输出错误信息，并停止执行  
                    console.error(`error: Cannot delete branch '${branchName}' because it is currently checked out.`);
                    return; 
                }
            }
            // 重命名文件，接下来会实现
            renameFileIfExists(this.localBranchesDir, branchName, newBranch);
        } catch (error) {
            // 检查是否是ENOENT错误，即文件或目录不存在  
            if (error.code === 'ENOENT') {
                console.error(`Branch '${branchName}' does not exist, so it cannot be deleted.`);
            } else {
                throw error; 
            }
        }
    }
    // 异步方法用于获取指定分支的哈希值
    // 参数branch为要获取哈希值的分支，默认为'HEAD'

    getBranchHash(filePath) {
        try {
            const headContent = fs.readFileSync(filePath || this.headFilePath, 'utf8');
            // console.log('Reading file:', filePath);
            // console.log('Content:', headContent);

            // 检查HEAD是否直接是一个合法的hash值
            if (/^[0-9a-f]{40}$/.test(headContent)) {
                return headContent; // 返回哈希值字符串
            }

            // 如果HEAD是一个符号引用（以'ref: '开头），解析出实际的分支引用路径并读取
            if (headContent.startsWith('ref: ')) {
                const headContentList = headContent.split('/');
                const newRefPath = `${this.localBranchesDir}/${headContentList[headContentList.length - 1]}`.trim(); // 移除'ref: '前缀
                return this.getBranchHash(newRefPath) // 返回哈希值字符串
            } else {
                throw new Error('Unexpected format in HEAD');
            }

        } catch (error) {
            throw error;
        }
    }

    // async getBranchHash(branch = 'HEAD') {
    //     let refPath = `${this.headFilePath}`;
    //     let headContent;
    //     try {
    //         // 尝试读取HEAD的内容
    //         headContent = await fs.promises.readFile(refPath, 'utf8');
    //         headContent = headContent.trim();

    //         // 检查HEAD是否直接是一个合法的hash值
    //         if (/^[0-9a-f]{40}$/.test(headContent)) {
    //             return headContent;
    //         }

    //         // 如果HEAD是一个符号引用（以'ref: '开头），解析出实际的分支引用路径并读取
    //         if (headContent.startsWith('ref: ')) {
    //             const headContentList = headContent.split('/')
    //             refPath = `${this.localBranchesDir}/${headContentList[headContentList.length-1]}`; // 移除'ref: '前缀
    //             headContent = await fs.promises.readFile(refPath, 'utf8');
    //             return headContent.trim();
    //         } else {
    //             throw new Error('Unexpected format in .git/HEAD');
    //         }
    //     } catch (error) {
    //         if (error.code === 'ENOENT') {
    //             throw new Error('Git repository not found or invalid branch provided');
    //         } else {
    //             throw error;
    //         }
    //     }
    // }

    // isRef(refStr) {
    //     if (refStr === undefined) {
    //         return false;
    //     }
    //     // 使用缓存的正则表达式对象进行检查  
    //     return (
    //         this.headsRefRegex.test(refStr) ||
    //         this.remotesRefRegex.test(refStr) ||
    //         this.specialRefs.has(refStr)
    //     );
    // }

    // async write(ref, content) {
    //     if (!refs.isRef(ref)) {
    //         throw new Error(`Invalid reference: ${ref}`);
    //     }
    //     try {
    //         // 规范化ref路径并转换为gitlet文件系统路径  
    //         const filePath = files.gitletPath(nodePath.normalize(ref));
    //         // 确定索引文件的路径
    //         this.RefPath = utils.getRepositoryType() === "bare" ?
    //             path.join(gitvRepoPath, path.normalize(ref)) :
    //             path.join(gitvRepoPath, ".gitv", path.normalize(ref))

    //         // 写入文件内容  
    //         await utils.writeToFile(filePath, content);
    //         console.log(`Wrote content to ${filePath}`);
    //     } catch (error) {
    //         // 如果写入文件时发生错误，抛出异常  
    //         throw new Error(`Failed to write to reference: ${error.message}`);
    //     }
    // }

    // read(path) {
    //     if (fs.existsSync(path)) {
    //         return fs.readFileSync(path, "utf8");
    //     }
    // }
}

module.exports = GitvRef;