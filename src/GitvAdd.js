const path = require("path")
const utils = require("./Utils")
const index = require("./GitvIndex")
class GitvAdd {
    constructor(pathOrfile) {
        this.pathOrfile = pathOrfile
        // 和之前gitv init 处理一样，对用户的路径参数统一成绝对路径
        this.fileOrDirPath = utils.resolveAbsolutePath(pathOrfile)
    }
    // 具体实现add命令的业务逻辑
    async add() {
        try {
            // 必须是Gitv仓库
            if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
            // 不能是裸仓库
            if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
            // 路径必须是Gitv仓库的工作目录的根目录下
            // this.fileOrDirPath在上面构造函数中定义
            if (!utils.isSubdirectory(utils.getGitvWorkingDirRoot(), this.fileOrDirPath)) throw new Error("target file or path is outside gitv repository")

            const files = await utils.collectFiles(this.fileOrDirPath);
            if (files.length === 0) throw new Error("not match any files");
            for (const file of files) {
                await index.updateIndex(file);
            }
        } catch (err) {
            throw err;
        }
    }
}

module.exports = GitvAdd;