const path = require('path')
const fs = require('fs')
const {
    createGitObject,
    sha1
} = require('./Utils');
const utils = require("./Utils");
const GitvConfig = require('./GitvConfig')
const GitvRef = require('./GitvRef');
const ref = new GitvRef();
const index = require("./GitvIndex");

const gitvConfig = new GitvConfig()
class Commit {
    constructor(treeSha, message) {
        // 传入上一步中生成的tree hash
        this.treeSha = treeSha;
        // 获取父提交 hash
        this.parentSha = this.getParentSha()
        // 获取作者信息
        this.author = this.getAuthor()
        // 接受用户添加的commit message
        this.message = message;
    }
    static isAncestor(descendentHash, ancestorHash) {
        return this.ancestors(descendentHash).indexOf(ancestorHash) !== -1;
    }

    static readCommit(commitId) {
        let content
        try {
            const filePath = path.join(utils.getResourcePath(), 'objects', commitId.slice(0, 2), '/', commitId.slice(2))
            content = fs.readFileSync(filePath, 'utf8').trim()
            const treeHashRegex = /tree (\w+)/;
            const match = content.match(treeHashRegex);

            if (match) {
                const treeHash = match[1];
                console.log('Tree Hash:', treeHash);
                return treeHash
            } else {
                console.log('Tree Hash not found');
                return undefined;
            }
        } catch (error) {
            return undefined
        }
    }

    ancestors(commitHash) {
        var parents = this.parentHashes(this.readCommit(commitHash));
        return util.flatten(parents.concat(parents.map(objects.ancestors)));
    }

    getParentSha() {
        return ref.getBranchHash(GitvRef.headFilePath)
    }

    getAuthor() {
        const conf = gitvConfig.read()
        return conf.user
    }

    createCommitObject(treeSha, message) {
        const commitTime = Math.floor(new Date().getTime() / 1000);
        const parentSha = this.getParentSha()
        const author = this.getAuthor()
        const commitLines = [
            `tree ${treeSha}`,
            parentSha ? `parent ${parentSha}` : '',
            `author ${author.name} <${author.email}> ${commitTime} ${Math.abs(new Date().getTimezoneOffset() / 60)}00`,
            `committer ${author.name} <${author.email}> ${commitTime} ${Math.abs(new Date().getTimezoneOffset() / 60)}00`,
            `date ${(new Date()).toISOString()}`,
            '',
            message
        ];

        return createGitObject(commitLines.join('\n'), 'commit')
    }

    getCommits() {
        let i = 0;
        const commits = [];
        let parentSha = this.getParentSha();
        while (parentSha && i < len) {
            i++
            const filePath = path.join(utils.getResourcePath(),'objects',parentSha.slice(0,2),'/',parentSha.slice(2))
            //读取到 commit 存储内容
            const commitContent = fs.readFileSync(filePath, 'utf8').trim()
            // parseCommitObject 解析 commit 字符为对象格式
            const commitData = this.parseCommitObject(commitContent);
            // 存储到 commits 数组
            commits.push(commitData);
            // 重置父提交 hash，递归查找
            parentSha = commitData.parentSha;
        }
        return commits;
    }

    static parseCommitObjectById(commitId) {
        try {
            const filePath = path.join(utils.getResourcePath('objects'), commitId.slice(0, 2), '/', commitId.slice(2))
            return this.parseCommitObjectByContent(fs.readFileSync(filePath, 'utf8').trim())
        } catch (err) {
            throw err;
        }
    }

    static parseCommitObjectByContent(commitContent) {
        // 定义正则表达式来匹配字段  
        const regexes = {
            tree: /^tree ([a-fA-F0-9]{40})$/,
            parent: /^parent ([a-fA-F0-9]{40})$/,
            author: /^author (.+)$/,
            committer: /^committer (.+)$/,
            date: /^Date: (.+)$/,
        };

        // 辅助函数来解析字段  
        function parseField(line, regex) {
            const match = line.match(regex);
            return match ? match[1] : null;
        }

        // 初始化结果对象  
        const result = {
            treeSha: '',
            parentShas: [],
            author: '',
            message: '',
            committer: '',
            date: '',
        };

        let isInMessage = false;
        const lines = commitContent.split('\n');

        for (const line of lines) {
            if (isInMessage) {
                // 累积消息内容，直到遇到下一个字段  
                if (!line.match(/^\s*[\w-]+:/)) { // 假设字段以冒号结尾，前面可能有空白字符和单词  
                    result.message += line + '\n';
                } else {
                    // 消息结束，设置 isInMessage 为 false  
                    isInMessage = false;
                }
            } else {
                // 尝试匹配并解析字段  
                for (const [fieldName, regex] of Object.entries(regexes)) {
                    if (line.match(regex)) {
                        if (fieldName === 'parent') {
                            result.parentShas.push(parseField(line, regex));
                        } else {
                            result[fieldName] = parseField(line, regex);
                        }
                        break; // 匹配到字段后退出循环  
                    }
                }

                // 如果不是字段，则可能是消息的开始  
                if (!Object.keys(regexes).some(fieldName => line.startsWith(fieldName))) {
                    isInMessage = true;
                }
            }
        }

        // 去除消息末尾的换行符  
        if (result.message.endsWith('\n')) {
            result.message = result.message.slice(0, -1);
        }

        return result;
    }

    // parseCommitObject(commitContent) {
    //     const lines = commitContent.split('\n');
    //     let treeSha = '';
    //     let parentSha = '';
    //     let author = '';
    //     let message = '';
    //     let date = '';
    //     let committer = '';

    //     for (const line of lines) {
    //         if (line.includes('tree')) {
    //             treeSha = line.split(' ')[2];
    //         } else if (line.startsWith('parent')) {
    //             parentSha = line.split(' ')[1];
    //         } else if (line.startsWith('author')) {
    //             author = line.split(' ').slice(1, -2).join(' ');
    //         } else if (line.startsWith('committer')) {
    //             committer = line.split(' ').slice(1, -2).join(' ');
    //         } else if (line.startsWith('date')) {
    //             date = line.split(' ').slice(1).join(' ');
    //         } else if (line === '') {
    //             // Skip empty line
    //         } else {
    //             message = line;
    //         }
    //     }

    //     return {
    //         treeSha,
    //         parentSha,
    //         author,
    //         message,
    //         committer,
    //         date
    //     };
    // }
}


module.exports = Commit;