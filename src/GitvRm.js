const path = require("path")
const fs = require("fs")
const fsPromise = fs.promises
const GitvConfig = require("./GitvConfig")
const utils = require("./Utils")
const index = require('./GitvIndex')

class GitvRm {
    constructor(pathOrfile, options) {
        this.pathOrfile = pathOrfile
        this.absolutePath = path.isAbsolute(this.pathOrfile) ? this.pathOrfile : (this.pathOrfile === '.' ? path.resolve(this.pathOrfile) : path.join(process.cwd(), this.pathOrfile))
        this.options = options
        this.gitvRepoPath = utils.getGivWorkingDirRoot()
    }

    async gitRm() {
        try {
            const {
                cached,
                r
            } = this.options
            // 必须是Gitv仓库
            if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
            // 不能是裸仓库
            if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
            if (!utils.isSubdirectory(utils.getGivWorkingDirRoot(), this.absolutePath)) {
                throw new Error("target file or path is outside gitv repository");
            }

            const stats = await fsPromise.stat(this.absolutePath);
            if (stats.isDirectory() && !r) {
                throw new Error(`not removing ${this.absolutePath} recursively without -r`);
            }

            const files = await utils.collectFiles(this.absolutePath);
            if (files.length !== 0 && !cached) {
                for (const filePath of files) {
                    await fsPromise.unlink(filePath);
                }
            }
            const filesToRm = await index.filteredFiles(files);
            filesToRm.forEach(async function (file) {
                await index.deleteAndWrite(path.relative(utils.getGivWorkingDirRoot(), file))
            });
        } catch (err) {
            throw err;
        }
    }

}

module.exports = GitvRm;