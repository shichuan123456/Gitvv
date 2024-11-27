const utils = require("./Utils");
const Commit = require('./Commit');
const commit = new Commit()

class GitvLog {
    constructor(options) {
        this.options = options;
    }

    async log() {
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
        // 不能是裸仓库
        if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");

        const n = this.options.number || Number.MAX_SAFE_INTEGER
        const commits = this.getCommits(n)

        this.printLogs(commits, this.options.oneline)
    }

    getCommits(n = 0) {
        return commit.getAllCommits(n)
    }

    printLogs(commits, oneline=false) {
        const colors = {
            FgYellow: "\x1b[33m",
            FgWhite: "\x1b[37m",
        };

        for (const commit of commits) {
            if(oneline) {
                console.log(colors.FgYellow,commit.treeSha.slice(0,7), colors.FgWhite, commit.message);
                console.log();
            }else {
                console.log(colors.FgYellow, 'commit', commit.treeSha);
                console.log(colors.FgWhite, 'Author: ', commit.author);
                console.log(colors.FgWhite, 'Date: ', utils.formattedDate(commit.date));
                console.log();
                console.log(colors.FgWhite, '    ', commit.message);
                console.log();
            }
        }
    }

}

module.exports = GitvLog;