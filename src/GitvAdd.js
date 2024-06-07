const path = require("path")
const utils = require("./Utils")
const index = require("./GitvIndex")
class GitvAdd {
    constructor(pathOrfile) {
        this.pathOrfile = pathOrfile
        /* 
        将用户输入参数进行统一化成绝对路径：
            1、如果输入的路径（this.pathOrfile）已经是绝对路径，则直接使用该路径  
            2、如果输入的路径是'.'（表示当前目录），则使用path.resolve()函数将其解析为绝对路径（默认是解析为当前工作目录的绝对路径）  
            3、如果输入的路径既不是绝对路径也不是'.'，则将其与当前工作目录（process.cwd()）进行拼接，并使用path.join()函数确保路径拼接的正确性  
        */
        this.gitvDir = path.isAbsolute(this.pathOrfile) ? this.pathOrfile : (this.pathOrfile === '.' ? path.resolve(this.pathOrfile) : path.join(process.cwd(), this.pathOrfile))
    }

    async add() {
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
        // 不能是裸仓库
        if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
        // 单数路径必须是Gitv仓库的工作目录的根目录下

        if (!utils.isSubdirectory(utils.getGivWorkingDirRoot(), this.gitvDir)) throw new Error("target file or path is outside gitv repository")

        try {
            const files = await utils.collectFiles(this.gitvDir);
            if (files.length === 0) {
                throw new Error("not match any files");
            }
            for (const file of files) {
                await index.updateIndex(file);
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = GitvAdd;