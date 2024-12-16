const path = require("path")
const fs = require("fs")
const fsPromise = fs.promises
const GitvConfig = require("./GitvConfig")
const utils = require("./Utils")
const index = require('./GitvIndex')

class GitvRm {
    constructor(pathOrfile, options) {
        this.pathOrfile = pathOrfile
        this.options = options
        this.absolutePath = utils.resolveAbsolutePath(this.pathOrfile)
    }

    async rm() {
        try {
            const {
                cached,
                r
            } = this.options
            // 必须是Gitv仓库
            if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
            // 不能是裸仓库
            if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
            if (!utils.isSubdirectory(utils.getGitvWorkingDirRoot(), this.absolutePath)) {
                throw new Error("target file or path is outside gitv repository");
            }

            const stats = await fsPromise.stat(this.absolutePath);
            let files;
            if (stats.isDirectory()) {
                if (!r)  throw new Error(`not removing ${this.absolutePath} recursively without -r`);
                files = await utils.collectFiles(this.absolutePath);
            } else {
                files = [this.absolutePath]
            }

            if (files.length !== 0 && !cached) {
                for (const filePath of files) {
                    await fsPromise.unlink(filePath);
                }
            }
            // 获取需要删除的文件列表
            const filesToRm = await index.filteredFiles(files);
            filesToRm.forEach(async function (file) {
                // 负责从索引中删除指定文件并更新索引
                await index.deleteAndWrite(path.relative(utils.getGittvWorkingDirRoot(), file))
            });
        } catch (err) {
            throw err;
        }
    }
}

module.exports = GitvRm;