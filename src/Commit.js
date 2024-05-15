const path = require('path')
const fs = require('fs')
const { createGitObject,sha1 } = require('./Utils');
const utils = require("./Utils");
const GitvConfig = require('./GitvConfig')
const GitvRef = require('./GitvRef');
const ref = new GitvRef();
const index = require("./GitvIndex");

const gitvConfig = new GitvConfig()
class Commit {
    constructor() {}

    getParentSha() {
        const parentHash = ref.getBranchHash(GitvRef.headFilePath)
        return parentHash
    }
    getAuthor() {
        const conf = gitvConfig.read()
        
        return conf.user
    }

    commitObject(treeSha, message) {
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

    readCommit(commitId) {
        let content
        try {
            const filePath = path.join(utils.getResourcePath(),'objects',commitId.slice(0,2),'/',commitId.slice(2))
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

    getAllCommits(n=0) {
        const len = n === 0 ? Number.MAX_VALUE : n
        let i = 0;
        const commits = [];
        let parentSha = this.getParentSha();
        while (parentSha && i < len) {
            i++
            const filePath = path.join(utils.getResourcePath(),'objects',parentSha.slice(0,2),'/',parentSha.slice(2))
            const commitContent = fs.readFileSync(filePath, 'utf8').trim()
            const commitData = this.parseCommitObject(commitContent);
            commits.push(commitData);
            parentSha = commitData.parentSha;
        }
        return commits;
    }

    parseCommitObject(commitContent) {
        const lines = commitContent.split('\n');
        let treeSha = '';
        let parentSha = '';
        let author = '';
        let message = '';
        let date = '';
        let committer = '';

        for (const line of lines) {
            if (line.includes('tree')) {
                treeSha = line.split(' ')[2];
            } else if (line.startsWith('parent')) {
                parentSha = line.split(' ')[1];
            } else if (line.startsWith('author')) {
                author = line.split(' ').slice(1, -2).join(' ');
            } else if (line.startsWith('committer')) {
                committer = line.split(' ').slice(1, -2).join(' ');
            }else if (line.startsWith('date')) {
                date = line.split(' ').slice(1).join(' ');
            } else if (line === '') {
                // Skip empty line
            } else {
                message = line;
            }
        }

        return { treeSha, parentSha, author, message,committer,date };
    }

}

module.exports = Commit;