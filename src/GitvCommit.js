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
            let headNameOrDesc

            if(refs.isHeadDetached()) {
               headNameOrDesc= "detached HEAD"
            }else {
                const headContent = FS.readFileSync(gitvRef.headFilePath, 'utf8');
                const headContentList = headContent.split('/');
                headNameOrDesc = (headContentList[headContentList.length - 1]).trim();
            }
            const commit = new Commit();
            const currentCommitId = refs.getBranchHash(gitvRef.headFilePath);
            const headHash = commit.readCommit(currentCommitId);

            /**
             * 1. treeHash->123 headHash->ref: refs/heads/main -> heads下没有main return undefined
             *    生成commit -> tree 123，创建main内容为刚生成的commit id=010
             * 2. treeHash->456 headHash->ref: refs/heads/main -> 010 -> tree 123
             *    456 !== 123，生成commit -> tree 456 ，id=020
             * 3. treeHash->456 headHash->ref: refs/heads/main -> 020 -> tree 456
             *    456 === 456 没有可变更的内容，不需要commit
             * */ 

            if(treeHash === headHash) {
                // 没有任何变更，不需要提交
                console.log(`On branch ${headNameOrDesc}`)
                console.log('nothing to commit, working tree clean')
            }else {
                const msg = await this.getCommitMsg();
                const commitObject = commit.commitObject(treeHash, msg);
                const commitHash = await this.writeCommit(commitObject)
                console.log("[" + headNameOrDesc + " " + commitHash.slice(0,7) + "] " + msg)
                
                // 修改branch的指向为最新的commit id
                refs.createRefById(headNameOrDesc, commitHash)

                return "[" + headNameOrDesc + " " + headHash + "] " + msg;
            }
        } catch (err) {
            console.error('===>error',err.message);
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

    async getCommitTreeHash() {
        const headFilePath = utils.getRepositoryType() === "bare" ?
            path.join(utils.getGivWorkingDirRoot(), "HEAD") :
            path.join(utils.getGivWorkingDirRoot(), ".gitv/HEAD");
        let commitHash = "";

        const headContent = await fs.readFile(headFilePath, 'utf8');
        console.log('===>',headFilePath,headContent)
        if (headContent.startsWith('ref: ')) {
            const branchName = headContent.replace('ref: ', '').trim();
            const branchHashPath = utils.getRepositoryType() === "bare" ?
                path.join(utils.getGivWorkingDirRoot(), "") :
                path.join(utils.getGivWorkingDirRoot(), ".gitv/HEAD");
            commitHash = await fs.readFile(headFilePath, 'utf8');

        } else {
            // HEAD处于分离状态，直接指向一个commit  
            commitHash = headContent;
            console.log('HEAD is in detached state, pointing to a specific commit');
        }

        const objectsHashPath = `${commitHash.substring(0, 2)}/${commitHash.substring(2)}`
        const commitHashPath = utils.getRepositoryType() === "bare" ?
            path.join(utils.getGivWorkingDirRoot(), `objects/${objectsHashPath}`) :
            path.join(utils.getGivWorkingDirRoot(), `.gitv/objects/${objectsHashPath}`);

        const commitContent = await fs.readFile(headFilePath, 'utf8');
        return commitContent.split(/\s/)[1];

    }

    async getTreeObj() {
        const idx = await index.read()
        // console.log(JSON.stringify(utils.indexTransform(utils.convertObject(idx)), null, 2));
        return utils.indexTransform(utils.convertObject(idx));
    }

    async writeTree(tree) {
        const treeObjects = await Promise.all(Object.keys(tree).map(async (key) => {
            if (typeof tree[key] === "string") {
                return "blob " + tree[key] + " " + key;
            } else {
                return "tree " + await this.writeTree(tree[key]) + " " + key;
            }
        }));
        const treeObject = treeObjects.join("\n") + "\n";
        // 假设这里是异步写入的逻辑
        try {
            const result = await index.writeObjects(treeObject);
            return result;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }

    async writeCommit(commit) {
        try {
            const result = await index.writeObjects(commit);
            return result;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }
}


module.exports = GitvCommit;