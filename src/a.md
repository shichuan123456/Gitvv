上小节中，我们成功实现了不带任何选项的`gitv branch`命令功能，接下来，我们将继续探索并实现其它核心功能。

## 实现 `gitv branch -r`

该命令会显示所有的远程跟踪分支（remote-tracking branches）。这些分支是本地仓库中对远程仓库分支的引用，通常用于追踪远程分支的变更。

- 读取本地仓库的 `./refs/remotes/` 目录下的所有文件。
- 遍历每个远程仓库的子目录（如 origin），并读取其中的文件。
- 将文件名和文件内容作为远程跟踪分支的信息。

   实现了`git branch`命令后，`git branch -r`的命令相对会好实现很多，大部分实现是一致的，在`refs/remotes/`下面可能会有多个远程仓库链接(对应多个不同的子文件夹)，这个在我们上面实现遍历文件夹下面所有文件的`readAllFilesInDirectory`时候已经实现。但是有一点需要注意是有的时候这些远程仓库下可能会有HEAD文件用来指向远程仓库的默认分支（我们在进行`git clone`的时候就会出现这个文件），而且它的展现形式会类似于下面（我们以远程仓库的默认名称origin为例）：
    ```js
    remotes/origin/HEAD -> origin/master
    ```
   - 如果HEAD文件中存放的是commit的hash值，则直接显示hash
   - 如果HEAD中存放的是ref（ref: refs/remotes/origin/master），我们会截取出origin/master。
   - 指针左边显示的不再是文件名，而是`remotes/origin/HEAD`

   ```js
   async remotesHeads(){
        try {
            // 读取本地分支目录中的所有文件，并返回文件名和内容组成的对象数组  
            const fileContents = []
            await utils.readAllFilesInDirectory(this.remoteBranchesDir, async (name, content, filePath) => {
                if (name === 'HEAD' && content.startsWith('ref: ')) {
                        // 如果是HEAD文件且内容以ref:开头  
                        const refPath = content.substring('ref: '.length).trim();  
                        // 提取ref指向的部分，例如/origin/master  
                        const refTarget = refPath.split('/').slice(2).join('/');   
              
                        // 使用path.dirname获取文件的父级目录  
                        const parentDir = path.basename(path.dirname(filePath)); 
                        const headRelativePath = path.join('remotes', '/', parentDir ,'HEAD'); 
                        // 将refTarget作为内容，并包含HEAD文件的相对路径  
                        fileContents.push({ name: headRelativePath, content: refTarget });  
                      } else {  
                        // 对于非HEAD文件或HEAD内容不是ref，直接包含文件名、路径和内容  
                        fileContents.push({ name: name, content });  
                      }
            });
            // 这个方法是远程分支引用的格式化方法，我们会在下面实现
            await this.displayRemotesBranches(fileContents);
        } catch (err) {
            // 捕获并处理错误  
            console.error('读取本地分支目录时发生错误:', err);
            throw err; // 重新抛出错误，以便调用者可以处理它  
        }
    }

   ```
  在处理HEAD文件的特殊需求时，我们巧妙地运用了`readAllFilesInDirectory`方法的第二个回调机制，这充分展示了该方法的灵活性和强大的扩展性。本质没有什么变化，只是对于展现形式做了定制化的处理，还有需要特别注意的一点是回调函数接收了第三个参数：文件的路径，我们需要在readAllFilesInDirectory方法中进行添加，也就是说所有我们需要的信息都可以通过回调的参数进行传递，非常方便。

 - 格式化输出远程跟踪分支列表

```js
     displayRemotesBranches(filesObj) {  
        filesObj.forEach(({name, content}) => {
            const isHead = name.indexOf("HEAD"); // 判断当前文件  
            if (isHead != -1) {
                console.log(`${name}  ---> ${content}`); // 输出文件名即可
            } else {
                console.log(`${name}`)
            }     
        })
    }
```
到此为止，我们`gitv branch -r`的核心功能都已经实现，下面我们看下这个方法的调用。
```js
// src/GitvBranch
async getRemoteBranches() {
     await this.ref.remotesHeads()
}
```
在上一节中，我们已经通过状态模式对`gitv branch`命令的各种选项功能调用进行了封装，因此，在本节中，我们只需专注于编写`getRemoteBranches`方法。具体的实现细节已经被封装到了`Ref`类中的`remotesHeads`方法中，这确保了我们的代码逻辑清晰、易于维护。通过这种封装方式，我们不仅能够提高代码的可读性和可复用性，还能确保功能的稳定性和可靠性。

## 实现 `gitv branch -a`

使用 -a 选项（代表“all”），git branch 命令将同时显示所有的本地分支和远程跟踪分支。这样，你可以在一个命令的输出中看到仓库的所有分支信息。
-  执行 `git branch` 命令获取并格式化输出本地分支列表。
-  执行 `git branch -r` 命令获取并格式化输出远程跟踪分支列表。

```js
  // src/GitvRef.js
  async getAllBranches() {
      await this.getLocalBranches()
      await this.getRemoteBranches()
  }
  ```
## 实现 `git branch new-feature`

- 检查当前所在的分支，记录其哈希值。
- 在 .git/refs/heads/ 目录下创建一个新文件 new-feature，文件内容为当前分支的哈希值。
```js
// 创建一个新的引用（分支）  
    async createRef(branchName) {
        try {
            // 获取当前HEAD指向的分支名  
            const headBranchName = await this.headBranchName();

            // 初始化commitHash为当前HEAD指向的分支名，如果HEAD是分离的，则这个值就是commit的hash  
            let commitHash = headBranchName;

            // 检查当前HEAD是否处于分离状态  
            if (!(await this.isHeadDetached())) {
                // 如果不是分离状态，读取HEAD指向的分支对应的commit hash  
                commitHash = await fsPromise.readFile(path.join(this.localBranchesDir, `${headBranchName}`), 'utf8');
            }

            // 创建新的分支文件，并写入commit hash  
            await fsPromise.writeFile(path.join(this.localBranchesDir, `${branchName}`), commitHash.trim(), 'utf8');

            // 方法结束，新分支创建成功  
            console.log(`新分支 ${branchName} 创建成功`);
        } catch (error) {
            // 捕获并处理异常  
            console.error(`创建分支 ${branchName} 时发生错误:`, error); 
            throw error; // 重新抛出错误，以便上层调用者可以处理  
        }
    }
```
在Ref中封装了`createRef`方法后，我们就可以在`Gitbranch`中进行调用了，如下：
  ```js
    async addBranch(branchName) {
        await this.ref.createRef(branchName);
    }
  ```
## 实现 `git branch -D branch-name`

- 无需检查 branch-name 分支的合并状态。
- 当前分支如果是要被删除的分支，报错提示用户。
- 如果被删除的分支不存在，同样提示用户。
- 直接删除 ./refs/heads/branch-name 文件。
  ```js
     // 异步删除引用（分支）  
    async deleteRef(branchName) {
        try {
            // 获取当前HEAD指向的分支名  
            const headBranchName = await this.headBranchName();

            // 检查当前HEAD是否处于分离状态  
            if (!(await this.isHeadDetached())) {
                // 如果不是分离状态，并且尝试删除的分支是当前检出的分支  
                if (branchName === headBranchName) {
                    // 输出错误信息，并停止执行  
                    console.error(`error: Cannot delete branch '${branchName}' because it is currently checked out.`);
                    return; // 提前返回，不执行删除操作  
                }
            }

            // 尝试删除分支文件  
            await fsPromise.unlink(path.join(this.localBranchesDir, `${branchName}`));

            // 分支删除成功  
            console.log(`Branch '${branchName}' has been deleted successfully.`);
        } catch (error) {
            // 检查是否是ENOENT错误，即文件或目录不存在  
            if (error.code === 'ENOENT') {
                console.warn(`Branch '${branchName}' does not exist, so it cannot be deleted.`);
            } else {
                // 对于其他类型的错误，记录错误信息并可能向上层抛出  
                console.error(`An error occurred while trying to delete branch '${branchName}':`, error);
                // 可以选择是否抛出错误  
                // throw error;  
            }
        }
    }
  ```
针对上述提到的两点检测——被删除的分支是当前分支、被删除的分支不存在，我们进行了相应的检测，并在发现这两种情况时，分别向用户输出明确的报错提示。这样做确保了删除操作的准确性和安全性同时为用户提供了更好的使用体验，并降低了在删除分支时可能发生的错误风险。
同样我们看下在`Gitbranch`中进行调用了，如下：
```js
 async deleteBranch(branchName) {
      await this.ref.deleteRef(branchName);
 }
```
## 实现 `git branch -m branch-name`
1.  **检查当前分支**：  
    确保用户不是要重命名当前所在的分支，因为 Git 不允许这样做。
    
1.  **如果仓库处于头指针分离状态，报错提示用户**：  
    当你处于分离 HEAD 状态时，Git 不允许你重命名分支。

1.  **检查分支是否存在**：  
    读取 `./refs/heads/` 目录下的文件，检查用户提供的旧分支名是否存在。

1.  **重命名分支**：  
    如果旧分支存在，并且不是当前分支，那么执行重命名操作：

    -   读取旧分支的引用文件（`./refs/heads/old-branch-name`）。
    -   将旧分支的引用文件内容写入新的引用文件（`./refs/heads/new-branch-name`）。
    -   删除旧的引用文件。

1.  **更新引用日志**：  
    如果 Git 仓库启用了引用日志（默认是启用的），你可能还需要更新 `./logs/refs/heads/old-branch-name` 和创建或更新 `./logs/refs/heads/new-branch-name`。我们暂不实现

1.  **错误处理**：  
    如果在上述过程中遇到任何问题（例如，当前分支就是要被重命名的分支，或者旧分支不存在），则向用户显示错误消息。
  ```js
     // 异步删除引用（分支）  
    async renameRef(branchName) {
        try {
            // 获取当前HEAD指向的分支名  
            const headBranchName = await this.headBranchName();

            // 检查当前HEAD是否处于分离状态  
            if (!(await this.isHeadDetached())) {
                // 如果不是分离状态，并且尝试删除的分支是当前检出的分支  
                if (branchName === headBranchName) {
                    // 输出错误信息，并停止执行  
                    console.error(`error: Cannot delete branch '${branchName}' because it is currently checked out.`);
                    return; // 提前返回，不执行删除操作  
                }
            }
            // 重命名文件，接下来会实现
            renameFileIfExists(folderPath, oldFileName, newFileName);
            // 分支删除成功  
            console.log(`Branch '${branchName}' has been deleted successfully.`);
        } catch (error) {
            // 检查是否是ENOENT错误，即文件或目录不存在  
            if (error.code === 'ENOENT') {
                console.warn(`Branch '${branchName}' does not exist, so it cannot be deleted.`);
            } else {
                // 对于其他类型的错误，记录错误信息并可能向上层抛出  
                console.error(`An error occurred while trying to delete branch '${branchName}':`, error);
                // 可以选择是否抛出错误  
                // throw error;  
            }
        }
    }
  ```
下面我们着重封装下`renameFileIfExists`，该方法用来检查文件是否存在，并进行重命名。
```js
 renameFileIfExists(folderPath, oldFileName, newFileName) {  
  // 构建文件的完整路径  
  const oldFilePath = path.join(this.localBranchesDir, oldFileName);  
  const newFilePath = path.join(this.localBranchesDir, newFileName);  
  
  // 检查文件是否存在  
  fs.access(oldFilePath, fs.constants.F_OK, (err) => {  
    if (err) {  
      // 如果文件不存在，则报错  
      console.error(`文件 ${oldFileName} 在文件夹 ${folderPath} 中不存在`);  
      process.exit(1);  
    } else {  
      // 如果文件存在，则进行重命名  
      fs.rename(oldFilePath, newFilePath, (renameErr) => {  
        if (renameErr) {  
          // 如果重命名过程中发生错误，则报错  
          console.error(`重命名文件 ${oldFileName} 到 ${newFileName} 时出错:`, renameErr);  
          process.exit(1); 
        } else {  
          // 重命名成功  
          console.log(`文件 ${oldFileName} 已重命名为 ${newFileName}`);  
        }  
      });  
    }  
  });  
}
```
同样我们看下在`Gitbranch`中进行调用了，如下：
```js
 async renameBranch(branchName) {
      await this.ref.renameRef(branchName);
 }
```
## 总结
在本次学习活动中，我们实现了多个Git分支相关的命令，包括列出远程分支、列出所有分支、创建新分支和强制删除分支。这些功能都是Git版本控制系统中非常基础和重要的部分，对于团队协作和项目管理至关重要。

首先，我们实现了`gitv branch -r`命令来列出所有远程分支。这个命令帮助用户了解当前仓库中有哪些远程分支，这对于跟踪和同步远程仓库的变化非常有用。

接着，我们实现了`gitv branch -a`命令，用于列出所有分支，包括本地和远程分支。这个命令提供了更全面的分支信息，方便用户进行全面的分支管理。

然后，我们实现了`git branch new-feature`命令来创建新的分支。这个命令允许用户根据当前工作创建新的分支，以便进行新功能的开发或修复bug，同时保持主分支的稳定性。

此外，我们还实现了`git branch -D branch-name`命令，用于强制删除一个分支。这个命令在分支不再需要或者需要重置时非常有用，但需要注意的是，强制删除分支会丢失该分支上的所有未合并的提交，因此在使用时需要谨慎。

虽然我们在本次学习中没有实现合并分支和检出分支的功能，但这些都是Git分支管理中非常重要的部分。合并分支可以将不同分支上的更改合并到一起，实现代码的集成；而检出分支则允许用户切换到不同的分支进行工作。这些功能将在后续的学习中逐步实现，以完善我们的Git分支管理系统。