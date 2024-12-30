const utils = require("./Utils")
const index = require("./GitvIndex")
const gitvRef = require("./GitvRef")
const FS = require('fs');
const fs = FS.promises
const path = require('path');
const refs = new gitvRef()
const Commit = require('./Commit');

class GitvCommit {
    constructor({
        message
    }) {
        this.commitMsg = message;
    }

    async commit() {
        try {
            // 必须是Gitv仓库
            if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
            // 不能是裸仓库
            if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
            // 暂存区的内容
            const idxTree = await this.getTreeObj()
            // 生成tree hash
            const treeHash = await this.writeTree(idxTree)
            const headNameOrDesc = refs.isHeadDetached() ? "detached HEAD" : refs.headBranchName();

            const headHash = Commit.parseCommitObjectById(refs.getBranchHash(gitvRef.headFilePath));

            /**
             * 1. treeHash->123 headHash->ref: refs/heads/main -> heads下没有main return undefined
             *    生成commit -> tree 123，创建main内容为刚生成的commit id=010
             * 2. treeHash->456 headHash->ref: refs/heads/main -> 010 -> tree 123
             *    456 !== 123，生成commit -> tree 456 ，id=020
             * 3. treeHash->456 headHash->ref: refs/heads/main -> 020 -> tree 456
             *    456 === 456 没有可变更的内容，不需要commit
             * */

            if (treeHash === headHash) {
                // 没有任何变更，不需要提交
                console.log(`On branch ${headNameOrDesc}`)
                console.log('nothing to commit, working tree clean')
            } else {
                const msg = await this.getCommitMsg();
                const commitObject = commit.commitObject(treeHash, msg);
                const commitHash = await this.writeCommit(commitObject)
                console.log("[" + headNameOrDesc + " " + commitHash.slice(0, 7) + "] " + msg)

                // 修改branch的指向为最新的commit id
                refs.updateRefByBranchName(headNameOrDesc, commitHash)

                return "[" + headNameOrDesc + " " + headHash + "] " + msg;
            }
        } catch (err) {
            throw err;
        }
    }

    async getCommitMsg() {
        try {
            const getResourcePath = utils.getResourcePath;

            const mergeMsgPath = utils.getResourcePath("MERGE_MSG");
            const mergeHeadPath = utils.getResourcePath("MERGE_HEAD");
            // 检查两个文件是否存在  
            if (await utils.checkFileExistence(mergeMsgPath) && await utils.checkFileExistence(mergeHeadPath)) {
                // 如果存在，读取MERGE_MSG文件的内容
                return await utils.readFileIfExistsAsync(mergeMsgPath);
            }
        } catch (error) {
            // 如果在检查文件或读取文件过程中发生错误，处理错误  
            console.error('An error occurred while checking or reading the merge message file:', error);
        }
        // 如果MERGE_MSG文件不存在或读取失败，返回this.commitMsg  
        return this.commitMsg;
    }

    async isMergeInProgress() {
        // 检测文件存在，并读取文件内容  
        // 获取具体路径
        const exists = await checkFileExistence(filePath);
    }

    async getTreeObj() {
        try {
            const idx = await index.read()
            return utils.indexTransform(utils.convertObject(idx));
        } catch (err) {
            throw err;
        }
    }

    // 定义一个异步函数 writeTree，它接受一个树对象作为参数  
    async writeTree(tree) {
        // 使用 Promise.all 并发处理树对象的每个键（即文件名或子目录名）
        // Object.keys(tree) 获取树对象的所有键，然后 map 遍历它们 
        const treeObjects = await Promise.all(Object.keys(tree).map(async (key) => {
            // 如果树对象的当前值是一个字符串（表示文件的内容哈希）  
            if (typeof tree[key] === "string") {
                // 返回一个字符串，格式为 "blob <内容哈希> <文件名>"  
                return "blob " + tree[key] + " " + key;
            } else {
                // 如果树对象的当前值是一个对象（表示子目录）  
                // 递归调用 writeTree 函数，处理这个子目录  
                // 等待递归调用完成，并获取返回的树对象字符串  
                // 然后返回一个字符串，格式为 "tree <子目录树对象字符串> <子目录名>"  
                // 这表示一个树对象，树对象用于表示目录结构  
                return "tree " + await this.writeTree(tree[key]) + " " + key;
            }
        }));

        // 将处理后的所有树对象字符串用换行符连接成一个完整的树对象字符串   
        const treeObject = treeObjects.join("\n") + "\n";
        try {
            // 调用 index.writeObjects 方法,并传入通过 utils.createGitObject 创建的 "tree" 对象  
            const result = await index.writeObjects(utils.createGitObject(treeObject, "tree"));
            // 返回写入操作的结果  
            return result;
        } catch (error) {
            throw error;
        }
    }

    async writeCommit(commit) {
        try {
            const result = await index.writeObjects(commit);
            return result;
        } catch (error) {
            throw error;
        }
    }
}


module.exports = GitvCommit;