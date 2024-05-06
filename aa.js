const path = require('path');
const utils = require('./utils'); // 假设有一个utils模块来提供一些工具函数

class GitvInitializer {
    constructor(directoryTarget = "", opts) {
        this.gitvDir = path.isAbsolute(directoryTarget) ? directoryTarget : path.join(process.cwd(), directoryTarget);

        if (utils.currentDirectoryIsGitvRepo(this.gitvDir)) {
            console.log(123);
            return;
        }

        this.opts = opts || {};
        this.gitvStructure = {
            HEAD: "ref: refs/heads/master\n",
            config: utils.obj2FileString({
                "core": {
                    "repositoryformatversion": "0",
                    "filemode": "false",
                    "bare": "false",
                    "logallrefupdates": "true",
                    "symlinks": "false",
                    "ignorecase": "true"
                },
                "user": {
                    "name": "robert",
                    "email": "robert@qq.com"
                }
            }),
            info: {
                exclude: `
                    # exclude patterns (uncomment them if you want to use them):
                    # *.[oa]
                    # *~
                    `
            },
            objects: {},
            refs: {
                heads: {},
                tags: {}
            }
        };
    }

    init() {
        utils.writeFilesFromTree(this.opts.bare ? this.gitvStructure : { ".gitv": this.gitvStructure }, this.gitvDir);
    }
}

module.exports = GitvInitializer;

// 使用方式
// const GitvInitializer = require('./GitvInitializer');
// const gitvInit = new GitvInitializer("your_directory_path", your_options);
// gitvInit.init();
