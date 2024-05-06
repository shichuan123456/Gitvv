const path = require("path")
const utils = require("./Utils")
const index = require("./GitvIndex")
class GitvAdd {
    constructor(pathOrfile) {
        this.pathOrfile = pathOrfile
    }

   async add() {
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
        // 不能是裸仓库
        if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
        // 单数路径必须是Gitv仓库的工作目录的根目录下
        if (!utils.isSubdirectory(utils.getGivWorkingDirRoot(), this.pathOrfile)) throw new Error("target file or path is outside gitv repository")
        // const gitvDir = path.isAbsolute(this.pathOrfile)? this.pathOrfile : path.join(process.cwd(), this.pathOrfile)
        const gitvDir = this.pathOrfile;
        try {
            const files = await utils.collectFiles(gitvDir);
            if (files.length === 0) {
                throw new Error("not match any files");
            }
            for (const file of files) {
                await index.updateIndex(file);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }
}

module.exports = GitvAdd;