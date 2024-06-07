const path = require("path")
const fs = require("fs")
const GitvConfig = require("./GitvConfig")
const utils = require("./Utils")
const GitvIndex = require('./GitvIndex')

class GitvRm {
    constructor(pathOrfile, options) {
        this.pathOrfile = pathOrfile
        this.absolutePath = path.isAbsolute(this.pathOrfile) ? this.pathOrfile : (this.pathOrfile === '.' ? path.resolve(this.pathOrfile) : path.join(process.cwd(), this.pathOrfile))
        this.options = options
        this.gitvRepoPath = utils.getGivWorkingDirRoot()
        this.index = new GitvIndex()
    }

    async gitRm() {
        const {
            cached,
            r
        } = this.options
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
        // 不能是裸仓库
        if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
        if (!this.isSubdirectory(this.getGivWorkingDirRoot(), this.pathOrfile)) {
            throw new Error("target file or path is outside gitv repository");
        }
        
        const stats = await fsPromise.stat(pathOrFile);
        if (stats.isDirectory() && !this.options.r) {
            throw new Error(`not removing ${pathOrfile} recursively without -r`);
        }



        const files = await utils.collectFiles(this.absolutePath);
        if (files.length !== 0 && !this.options.cached) {
            for (const filePath of files) {
                await fs.unlink(filePath);
            }
        }
        
        const filesToRm = this.index.filteredFiles();
        
    }
}

module.exports = GitvRm;