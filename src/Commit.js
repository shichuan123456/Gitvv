const { createGitObject,sha1 } = require('./Utils');
const GitvConfig = require('./GitvConfig')
const GitRef = require('./GitvRef')
const ref = new GitRef();

const gitvConfig = new GitvConfig()
class Commit {
    constructor(treeSha, message) {
        this.treeSha = treeSha;
        this.parentSha = this.getParentSha()
        this.author = this.getAuthor()
        this.message = message;


    }

    getParentSha() {
        const parentHash = ref.getBranchHash()
        .then(hash=>{
            console.log('====>parentHash',hash,parentHash)
        })
        console.log('====>parentHash',parentHash)
        return sha1('committer')
    }
    getAuthor() {
        const conf = gitvConfig.read()
        
        return conf.user
    }

    commitObject() {
        const commitTime = Math.floor(new Date().getTime() / 1000);
        const parentSha = this.parentSha
        const treeSha = this.treeSha
        const author = this.author
        const message = this.message

        const commitLines = [
            `tree ${treeSha}`,
            parentSha ? `parent ${parentSha}` : '',
            `author ${author.name} <${author.email}> ${commitTime} ${Math.abs(new Date().getTimezoneOffset() / 60)}00`,
            `committer ${author.name} <${author.email}> ${commitTime} ${Math.abs(new Date().getTimezoneOffset() / 60)}00`,
            '',
            message
        ];

        return createGitObject(commitLines.join('\n'), 'commit')
    }

}

module.exports = Commit;