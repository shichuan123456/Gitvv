const path = require("path")
const GitvConfig = require("./GitvConfig")
const utils = require("./Utils")


class GitvInit {
    constructor(directoryTarget, options) {
        this.directoryTarget = directoryTarget
        this.options = options
        this.gitvConfig = new GitvConfig(this.options)
    }

    async init() {
        try {
            const gitvPath = utils.resolveAbsolutePath(this.directoryTarget);
            if (utils.directoryIsGitvRepo(gitvPath)) throw new Error(`The directory ${gitvPath} is already a gitv repository`);
            // 生成Gitv中的默认配置映射JS对象
            const gitvDefaultConfig = this.genGitVMetadataModel()
            // 生成目录、文件、完成初始化
            console.log(gitvDefaultConfig);
            await utils.writeFilesFromTree(gitvDefaultConfig, gitvPath);
        } catch (err) {
            throw err
        }
    }

    genGitVMetadataModel = () => {
        const gitvInitConfig = {
            // 默认当前仓库是master分支（后面课程会详细介绍）
            HEAD: "ref: refs/heads/master\n",
            // config文件
            config: this.gitvConfig.objToGitConfigString(this.gitvConfig.generateDefaultConfig()),
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