const path = require("path")
const fs = require('fs')
const gitvRef = require("./src/GitvRef")
const Commit = require('./src/Commit');
const commit = new Commit()
const refs = new gitvRef()

const currentCommitId = refs.getBranchHash(gitvRef.headFilePath)
const commits = commit.getAllCommits(2)
console.log(commits)


function formattedDate(dateString) {
    const date = new Date(dateString);

    const options = { 
        weekday: 'short', 
        month: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        year: 'numeric', 
        timeZoneName: 'short' 
    };
    return date.toLocaleString('en-US', options);
}


const colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"
};


function gitLog(commits) {
    for (const commit of commits) {
      console.log(colors.FgYellow, 'commit', commit.treeSha);
    //   if (commit.parentSha) {
    //     console.log('parent', commit.parentSha);
    //   }
      console.log(colors.FgWhite, 'Author: ', commit.author);
      console.log(colors.FgWhite, 'Date: ', formattedDate(commit.date));
      console.log();
      console.log(colors.FgWhite, '    ', commit.message);
      console.log();
    }
  }
  

  gitLog(commits);
// const filePath = path.join(__dirname,'.gitv/objects','21/4cb2ef675f7ef7d579a49c469bdebf7279c6c1')
// const content = fs.readFileSync(filePath, 'utf8').trim()
// console.log(content)

// const treeHashRegex = /tree (\w+)/;
// const match = content.match(treeHashRegex);

// if (match) {
//     const treeHash = match[1];
//     console.log('Tree Hash:', treeHash);
// } else {
//     console.log('Tree Hash not found');
// }


// const c = fs.readFileSync(path.join(__dirname,'.gitv/objects','11/f07f4ec38bacc9885d8150d3f4d1bb3296626e'))

// console.log('==>>',c)