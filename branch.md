上一节，我们详尽地解析了分支技术的核心工作原理，对 git branch 命令的每个选项逐个做了详细剖析，同时，我们也深入探讨了这些操作的实际需求与可行的实现策略。
本节我们将逐个实现这些命令。

## 功能准备

### 初始化命令结构

首先，我们需要在 `bin/index.js` 中定义 `gitv branch` 命令及其选项。确保了能够通过命令行接口使用我们的 `gitv branch` 命令。

```js
// bin/index.js
program
    .command('branch [branchName]')
    .description('Manage branches within the local Git repository')
    .option('-r, --remote', 'List all remote branches')
    .option('-v, --verbose', 'Be verbose and show commit details along with branch names')
    .option('-a, --all', 'List all branches, both local and remote')  
    .option('-d, --delete', 'Delete an existing branch (must be merged or force with -D)')
    .option('-m, --move', 'Rename a branch')    
    .action((branchName, options) => {
        // 调用branch方法，下面会进行模块的功能模块添加 
        gitv.branch(branchName, options);
    });
```
###  添加功能模块

   业务功能需要封装在各自的类模块中，所以我们新建`src/GitvBranch.js`文件，并初始化`GitvBranch`类：

```js
// src/GitvBranch.js
class GitvBranch {
    constructor(branchName, options) {
        this.branchName = branchName;
        this.options = options;
    }

    branch() {
      // 必须是Gitv仓库
      if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository"); 
      console.log(`git branch execute ${this.branchName}----${JSON.stringify(this.options)}`);
    }
}

module.exports = GitvBranch;
```
  使用git branch命令时，必须确保当前处于Git的仓库环境中，因为该命令用于列出、创建或删除仓库中的分支。此外，即使在裸仓库（即只包含版本历史信息而不包含工作文件的Git仓库）中，git branch命令也是可以执行的，因为它仅涉及到对分支的元数据操作，而不涉及具体的工作文件内容。

  下面我们在`Gitv`中实例化`GitvBranch`并调用`branch`方法实现该功能:

```js
// Gitv.js
const GitvBranch = require("./GitvBranch");

class Gitv {
  // ...
  branch(branchName, options) {
    this.gitvBranch = new GitvBranch(branchName, options)
    this.gitvBranch.branch();
  }
}
```
主体框架代码已完成，接下来我们只需要实现`GitvBranch`类的`branch`实例方法即可。

## 实现 `gitv branch` 命令核心功能
通过之前章节的学习，我们深入理解了Git分支的实现是基于引用（ref）的。Git利用引用来跟踪和定位不同的提交对象，而分支作为Git的重要特性，本质上就是一个指向特定提交对象的引用。为了更好地管理这些引用和分支操作，我们可以封装一个Ref类来统一处理所有与指针相关的操作。这样，分支的创建、修改和删除以及后面我们要学到的Git的其它功能都可以直接通过调用Ref类的相应方法来实现，从而提高了代码的可维护性和复用性。
```js
// src/GitvRef.js
const utils = require("./")
class GitvRef {
  constructor() {
    // 获取 Gitv 仓库的根路径
    const gitvRepoPath = utils.getResourcePath();
    // 本地分支目录的路径
    this.localBranchesDir = path.join(gitvRepoPath, 'refs', 'heads');
    // 远程分支目录的路径
    this.remoteBranchesDir = path.join(gitvRepoPath, 'refs', 'remotes');
    // HEAD文件的路径
    this.headFilePath = path.join(gitvRepoPath, 'HEAD');
  }
}
module.exports = new GitvRef();
```
考虑到后续代码中需要频繁使用本地分支目录、远程分支目录以及HEAD文件的路径，我们在构造函数中预先获取并存储这些路径，以便后续功能的实现可以直接引用。

### 实现 `gitv branch`

该命令主要用于列出仓库中的本地分支。当你执行这个命令时，它会显示当前仓库所有本地分支的列表，并且会在当前活动的（即当前检出的）分支前用星号（*）标记。帮助用户快速查看和了解当前仓库中本地分支的状态。

- 读取本地仓库的 .git/refs/heads/ 目录下的所有文件。
  我们首先封装一个名为`readAllFilesInDirectory`的公用方法，它递归地读取指定目录及其子目录中的所有文件，并允许调用者通过传入一个自定义的回调函数cb来灵活处理每个文件的内容。这种方法增强了函数的通用性和可重用性，使得调用者能够根据自己的需求来定义文件内容的处理方式，而无需修改函数本身的内部逻辑。

    ```js
    //src/Utils.js
    const fs = require('fs').promises;
    const path = require('path');
    async readAllFilesInDirectory(dirPath, cb) {
        try {
            // 读取目录中的所有文件和子目录  
            const files = await fs.readdir(dirPath, {
                withFileTypes: true
            });

            for (const dirent of files) {
                const resolvedPath = path.resolve(dirPath, dirent.name);

                if (dirent.isFile()) {
                    // 如果是文件，读取文件内容  
                    const content = await fs.readFile(resolvedPath, 'utf8');
                    // 调用传入的回调函数处理文件内容  
                    await cb(dirent.name, content);
                } else if (dirent.isDirectory()) {
                    // 如果是目录，递归读取该目录下的所有文件  
                    await readAllFilesInDirectory(resolvedPath, cb);
                }
            }
        } catch (err) {
            console.error(`无法读取目录 ${dirPath}:`, err);
            throw err; // 重新抛出错误以便调用者可以处理它  
        }
    }
   
  ```
  - 将每个文件名（不含扩展名）作为分支名，文件内容作为分支指向的提交哈希值。
    这个步骤实质上是对`readAllFilesInDirectory`方法第二个参数（回调函数）进行封装，目的在于将读取到的文件名与其内容相匹配，并最终生成一个包含这些信息的对象数组，方便后面的格式化展示。
  ```js
  // src/GitvRef.js
  const utils = require("../Utils.js")
  async getLocalBranchs() {
    const fileContents = [];
    const headsPath = utils.getResourcePath('refs/heads');
    const branchObj = await utils.readAllFilesInDirectory(headsPath); 
  }
  ```
- 格式化输出分支列表，标记当前所在的分支（如果有的话）。
  - 在Git中，头指针可能处于分离状态，这意味着它可能指向一个具体的提交哈希值而非分支名。为了准确判断当前头指针的状态，我们需要封装一个isHeadDetached函数，专门用于检测头指针是否指向了一个具体的提交而不是分支。通过这个函数，我们可以更清晰地了解头指针的状态，从而进行相应的操作和信息展示。
  ```js
  async isHeadDetached: function() {  
    // 读取.git/HEAD文件的内容
    const headContent = await fs.readFile(utils.getResourcePath('HEAD'), 'utf8');  
    // 直接返回是否不是以"ref: "开头，表示头指针是否分离  
    return !headContent.startsWith("ref: ");  
  } 
  ```
  - 获取当前活跃分支
  ```js
  headBranchName: function() {
    const headContent = await fs.readFile(utils.getResourcePath('HEAD'), 'utf8');
    if (!refs.isHeadDetached()) {
      return headContent.match("refs/heads/(.+)")[1];
    }
    return headContent;
  }
  ```
  
  - 格式化输出分支列表
   
  ```js
    function displayFilesAsGitBranches(filesObj, currentBranchOrHash, isHeadDetached) {  
      // 如果提供了 currentCommitHash 并且它不在 filesObj 的值中，则表示 HEAD 是分离的  
      if (isHeadDetached)  console.log(`* (HEAD detached at ${currentBranchOrHash})`);  
      // 遍历对象并输出分支名  
      for (const fileName in filesObj) {  
        const isCurrent = currentBranchOrHash === fileName; // 判断当前文件  
        const prefix = isCurrent ? '*' : ' '; // 设置前缀，当前文件用 '*' 表示  
        console.log(`${prefix} ${fileName}`); // 输出文件名，前面加上前缀  
      }
    }
  ```


  到目前为止我们已经完全实现了`git branch`的功能，现在我们看下完整的代码
  ```js
  // src/GitvRef.js
  const utils = require("../Utils.js")
  async getLocalBranchs() {
    const headsPath = utils.getResourcePath('refs/heads');
    const branchObj = await utils.readAllFilesInDirectory(headsPath); 
    const currentBranchOrHash = await this.headBranchName();
    displayFilesAsGitBranches(files, currentBranchOrHash, refs.isHeadDetached());
  }
  ```

### 实现 `gitv branch -r`

该命令会显示所有的远程跟踪分支（remote-tracking branches）。这些分支是本地仓库中对远程仓库分支的引用，通常用于追踪远程分支的变更。

- 读取本地仓库的 .git/refs/remotes/ 目录下的所有文件。
- 遍历每个远程仓库的子目录（如 origin），并读取其中的文件。
实现了`git branch`命令后，`git branch -r`的命令相对会好实现很多，大部分实现是一致的，在`refs/remotes/`下面可能会有多个远程仓库链接，这个在我们上面实现遍历文件夹下面所有文件的`readAllFilesInDirectory`时候已经实现。但是有一点需要注意是有的时候这些远程仓库下可能会有HEAD文件用来指向远程仓库的默认分支，而且它的展现形式会类似于下面：
```js
remotes/origin/HEAD -> origin/master
```
   - 如果HEAD中存放的是commit的hash值，则直接显示hash
   - 如果HEAD中存放的是ref（ref: refs/remotes/origin/master），我们会截取出origin/master。
   - 指针左边显示的不再是文件名，而是`remotes/origin/HEAD`

   ```js
  async function readAllFilesInDirectoryWithHead(dirPath) {  
  try {  
    // 读取目录中的所有文件和子目录  
    const files = await fs.readdir(dirPath, { withFileTypes: true });  
    const fileContents = [];  
  
    for (const dirent of files) {  
      const resolvedPath = path.resolve(dirPath, dirent.name);  
  
      if (dirent.isFile()) {  
        console.log(dirent);
        // 如果是文件，读取文件内容  
        const content = await fs.readFile(resolvedPath, 'utf8');  
        if (dirent.name === 'HEAD' && content.startsWith('ref: ')) {  
          // 如果是HEAD文件且内容以ref:开头  
          const refPath = content.substring('ref: '.length).trim();  
          // 提取ref指向的部分，例如/origin/master  
          const refTarget = refPath.split('/').slice(2).join('/');   

          const filePath = path.join(dirPath, dirent.name);  
          // 使用path.dirname获取文件的父级目录  
          const parentDir = path.basename(path.dirname(filePath)); 
          const headRelativePath = path.join('remotes', '/', parentDir ,'HEAD'); 
          // 将refTarget作为内容，并包含HEAD文件的相对路径  
          fileContents.push({ name: headRelativePath, content: refTarget });  
        } else {  
          // 对于非HEAD文件或HEAD内容不是ref，直接包含文件名、路径和内容  
          fileContents.push({ name: dirent.name, content });  
        }  
      } else if (dirent.isDirectory()) {  
        // 如果是目录，递归读取该目录下的所有文件  
        const subDirContents = await readAllFilesInDirectory(resolvedPath);  
        fileContents.push(...subDirContents);  
      }  
    }  
  
    return fileContents;  
  } catch (err) {  
    console.error(`无法读取目录 ${dirPath}:`, err);  
    throw err; // 重新抛出错误以便调用者可以处理它  
  }  
}
    ```



    - 将文件名和文件内容作为远程跟踪分支的信息。
    - 格式化输出远程跟踪分支列表

```js
  // src/GitvRef.js
  const utils = require("../Utils.js")
  async getRemoteBranches() {
    const headsPath = utils.getResourcePath('refs/remotes');
    const branchObj = await utils.readAllFilesInDirectoryWithHEAD(headsPath); 
    displayFilesAsGitBranches(files, "", false);
  }
  ```

### 实现 `gitv branch -a`

使用 -a 选项（代表“all”），git branch 命令将同时显示所有的本地分支和远程跟踪分支。这样，你可以在一个命令的输出中看到仓库的所有分支信息。

```js
  // src/GitvRef.js
  const utils = require("../Utils.js")
  async getAllBranchs() {
    this.getLocalBranches()
    this.getRemoteBranches();
  }
  ```


### 实现 `git branch new-feature`

- 检查当前所在的分支，记录其哈希值。
- 在 .git/refs/heads/ 目录下创建一个新文件 new-feature，文件内容为当前分支的哈希值。
- 更新本地仓库的引用信息。

### 实现 `git branch new-feature`

- 检查当前所在的分支，记录其哈希值。
- 在 .git/refs/heads/ 目录下创建一个新文件 new-feature，文件内容为当前分支的哈希值。
- 更新本地仓库的引用信息。

### 实现 `git branch -d branch-name`

无需检查 branch-name 分支的合并状态。
直接删除 .git/refs/heads/branch-name 文件。
更新本地仓库的引用信息。


// todo error: Cannot delete branch 'm' checked out at 'C:/workspace/gittest'

## 总结

