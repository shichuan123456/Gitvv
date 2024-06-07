const path = require("path")
const GitvConfig = require("./GitvConfig")
const utils = require("./Utils")


class GitvInit {
    constructor(directoryTarget, options) {
        this.directoryTarget = directoryTarget
        this.options = options
        this.GitConfig = new GitvConfig(this.options)
    }

    async init() {
        try {
            const gitvDir = this.resolveGitvDirectory(this.directoryTarget);
            if (utils.directoryIsGitvRepo(gitvDir)) {
                console.error("The directory is already a gitv repository");
                return;
            }
            const gitvDefaultConfig = this.getGitvMapper()

            await utils.writeFilesFromTree(gitvDefaultConfig, gitvDir);
        } catch (err) {
            throw err
        }
    }

    // 如果目录目标已经是绝对路径，则直接返回；否则，将其与当前工作目录拼接后返回  
    resolveGitvDirectory(directoryTarget) { 
        if (typeof directoryTarget !== 'string' || directoryTarget === '') {
            throw new Error('Invalid directory target: must be a non-empty string');
        }

        if (path.isAbsolute(directoryTarget)) {
            // 如果是绝对路径，则直接返回  
            return directoryTarget;
        } else {
            // 如果不是绝对路径，则与当前工作目录拼接  
            return path.join(process.cwd(), directoryTarget);
        }
    }

    getGitvMapper = () => {
        const gitvInitConfig = {
            HEAD: "ref: refs/heads/master\n",
            config: this.GitConfig.objToGitConfigString(this.GitConfig.generateDefaultConfig()),
            info: {
                exclude: `
                        # exclude patterns (uncomment them if you want to use them):
                        # *.[oa]
                        # *~
                        `.trim().replace(/^\s+/gm, '')
            },
            objects: {},
            refs: {
                heads: {},
                tags: {}
            }
        }
        // 如果是裸仓库，则不生成.git文件夹
        return this.options.bare ? gitvInitConfig : {
            '.gitv': gitvInitConfig
        }
    }
}

module.exports = GitvInit;