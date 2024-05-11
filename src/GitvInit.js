const path = require("path")
const GitvConfig = require("./GitvConfig")
const utils = require("./Utils")


class GitvInit { 
    constructor(directoryTarget, options) {
        this.directoryTarget = directoryTarget
        this.options = options
        this.GitConfig = new GitvConfig(this.options)
    }

    init() {
        // process.cwd()是当前执行命令的时候文件夹所在的地址
       const gitvDir = path.isAbsolute(this.directoryTarget)? this.directoryTarget : path.join(process.cwd(), this.directoryTarget)
       if (utils.directoryIsGitvRepo(gitvDir))  throw new Error("The directory is already a gitv repository");
       const gitvDefaultConfig = this.getGitvMapper()

       utils.writeFilesFromTree(gitvDefaultConfig, gitvDir);  
       console.log("GitvInit initialized successfully",gitvDefaultConfig)
    }

    getGitvMapper = () => {       
        const gitvInitConfig =  {
            HEAD: "ref: refs/heads/master\n",
            config: this.GitConfig.objToGitConfigString(this.GitConfig.generateDefaultConfig()),
            info: {
                 exclude: `
                        # exclude patterns (uncomment them if you want to use them):
                        # *.[oa]
                        # *~
                        `.trim().replace(/^\s+/gm, '')
            },
            objects:{},
            refs: {
                heads: {},
                tags: {}
            }
        }
        // 如果是裸仓库，则不生成.git文件夹
        return this.options.bare ? gitvInitConfig : {'.gitv': gitvInitConfig}
    }
}

module.exports = GitvInit;





