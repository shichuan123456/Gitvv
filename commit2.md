
上小节中，我们已针对`git commit`命令的核心功能进行了全面且细致的前期准备，通过深入的需求分析，我们已清晰明了该命令的期望行为。在详尽地剖析了命令的实现步骤后，本小节我们将正式亲手实现我们自己的`gitv commit`命令。通过这一实现过程，我们将更加深入地掌握`Git`的核心原理，同时进一步提升我们的编程技巧与问题解决能力。

## **准备工作**

### 初始化命令结构
首先，我们需要在 `bin/index.js` 中定义 `gitv commit` 命令及其选项。这一步确保了能够通过命令行接口使用我们的 `gitv commit` 命令。
```js
// bin/index.js
// ...
program
  .command('commit')  
  // 添加 -m 或 --message 选项，并设置描述
  .option('-m, --message <message>', 'commit message')   
  // 添加命令描述
  .description('Record changes to the repository') 
  .action((options) => {  
    // 检查 -m 参数是否已提供并且不为空  
    if (!options.message || options.message.trim() === '') {  
      console.error('Error: Commit message is required and cannot be empty.');  
      process.exit(1); // 退出程序并返回错误码 1  
    }  
  })
```
在Git中，执行提交操作时，如果未使用`-m`参数来指定提交信息，Git会进入交互式模式，并打开`COMMIT_EDITMSG`文件以便用户添加和保存提交信息。然而，在我们设计的`gitv`命令行工具中，我们并未实现这种交互式模式，而是选择通过报错提示用户需要提供提交信息

###  添加功能模块

  业务功能需要封装在各自的类模块中，所以我们新建`src/GitvAdd.js`文件，并初始化`GitvAdd`类：

```js
// src/GitvAdd.js
class GitvCommit { 
    constructor({message}) {
        // 接收命令参数
        this.commitMsg = message;
    }
    // 具体实现commit命令的业务逻辑
    commit() {
       // 必须是Gitv仓库
      if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
      // 不能是裸仓库
      if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
    }
}
module.exports = GitvCommit;
```
`gitv commit` 命令的执行需要确保当前目录是一个非裸的 `Gitv` 仓库，以确保用户能够在包含实际文件的工作环境中进行版本提交。我们直接使用封装的工具方法进行校验，以确保命令在正确的上下文中执行。

   下面我们在`Gitv`中实例化`GitvCommit`并调用`commit`方法实现该功能:

  ```js
// Gitv.js
const GitvCommit = require("./GitvCommit");

class Gitv {
  // ...
  commit(options) {
    this.gitvCommit  = new GitvCommit(options)
    this.gitvCommit.commit();
 }
}
```
   主体框架代码已完成，接下来我们只需要实现`GitvCommit`类的`commit`实例方法即可。
## 实现 gitv commit 功能

###  **创建树对象**
根据当前暂存区的状态创建一个新的树对象，并返回其哈希值。这个树对象代表了暂存区中所有文件的当前状态。
暂存区格式如下：

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b8e75a1dc6f541e7af7e1ad3420aec82~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=564&h=254&s=34776&e=png&b=212121)
我们通过封装的index的read方法读取出index对象，格式如下：
```js
{
  "src\\Gitv.js,0": "dc083e04a70279ff8f127ba98db736d36081384f",
  "src\\GitvAdd.js,0": "84688fba00c16fa715346679b9f3c975cce15f31",
  "src\\GitvCommit.js,0": "2448096aeb0b30e0c57b88547e31a5fdd453ff22",
  "src\\GitvConfig.js,0": "23e184e6d8eb90806b6a1c2a8286e4bc8d6337bd",
  "src\\GitvIndex.js,0": "88f47d336b52c5811b3c3a746b04c7c64e3a129e",
  "src\\GitvInit.js,0": "c4f57e9705c28763d115c012dd61d430bda1be51",
  "src\\Refs.js,0": "d687f3e12a79d2688825eb94dc6829b8fe334845",
  "src\\Utils.js,0": "014756fb2ca6f1b02d25c3d8ed62df413f97c998",
  "src\\z.js,0": "0ea349558f6d9e316e8adfaedc88a0b5677f41f6",
  "src\\lib\\a.js,0": "2e65efe2a145dda7ee51d1741299f848e5bf752e",
}
```
为了方便，我们需要进行格式的转换，转换成新的对象。我们会封装两个方法，convertObject，通过该方法讲index的原始格式装换成没有stage number的对象，如下：
```js
{
  "src\\Gitv.js": "dc083e04a70279ff8f127ba98db736d36081384f",
  "src\\GitvAdd.js": "84688fba00c16fa715346679b9f3c975cce15f31",
  "src\\GitvCommit.js": "2448096aeb0b30e0c57b88547e31a5fdd453ff22",
  "src\\GitvConfig.js": "23e184e6d8eb90806b6a1c2a8286e4bc8d6337bd",
  "src\\GitvIndex.js": "88f47d336b52c5811b3c3a746b04c7c64e3a129e",
  "src\\GitvInit.js": "c4f57e9705c28763d115c012dd61d430bda1be51",
  "src\\Refs.js": "d687f3e12a79d2688825eb94dc6829b8fe334845",
  "src\\Utils.js": "014756fb2ca6f1b02d25c3d8ed62df413f97c998",
  "src\\z.js": "0ea349558f6d9e316e8adfaedc88a0b5677f41f6",
  "src\\lib\\a.js": "2e65efe2a145dda7ee51d1741299f848e5bf752e",
},
```
然后再通过indexTransform进行key的进一步转换，将路径也解析成对象的嵌套形式：
```js
{
    "src": {
      "Gitv.js": "dc083e04a70279ff8f127ba98db736d36081384f",
      "GitvAdd.js": "84688fba00c16fa715346679b9f3c975cce15f31",
      "GitvCommit.js": "2448096aeb0b30e0c57b88547e31a5fdd453ff22",
      "GitvConfig.js": "23e184e6d8eb90806b6a1c2a8286e4bc8d6337bd",
      "GitvIndex.js": "88f47d336b52c5811b3c3a746b04c7c64e3a129e",
      "GitvInit.js": "c4f57e9705c28763d115c012dd61d430bda1be51",
      "Refs.js": "d687f3e12a79d2688825eb94dc6829b8fe334845",
      "Utils.js": "014756fb2ca6f1b02d25c3d8ed62df413f97c998",
      "z.js": "0ea349558f6d9e316e8adfaedc88a0b5677f41f6",
      "lib": {
        "a.js": "2e65efe2a145dda7ee51d1741299f848e5bf752e"
      }
    }
  }
```
对于这样的树对象，我们后面处理起来会容易很多。
```js
// GitvIndex.js
 const utils = require("./Utils")
 async getTreeObj() {
      const idx = await index.read()
      return utils.indexTransform(utils.convertObject(idx));
}

```

### **写入树对象**
Git通过引入树对象和blob对象来组织和管理仓库中的文件和目录。当进行提交时，Git会为每个文件创建一个blob对象，用于存储文件的实际内容。对于目录（文件夹），Git会创建一个树对象，该对象包含目录中所有文件和子目录的引用（指向它们各自的blob或树对象）。

通过这种方式，Git能够构建一个层次化的数据结构，完整地表示仓库中的文件和目录结构。这种结构使得Git能够高效地跟踪文件的变更历史，包括文件的添加、修改和删除，以及目录结构的调整。同时，由于每个对象都有唯一的哈希值，Git可以确保数据的完整性和一致性，从而提供可靠的版本控制功能。

因此，在Git提交时写入树对象和blob对象是必要的，它们共同构成了Git仓库中文件和目录的完整表示，为版本控制提供了坚实的基础。

```js
 async writeTree(tree) {
        const treeObjects = await Promise.all(Object.keys(tree).map(async (key) => {
            if (typeof tree[key] === "string") {
                return "blob " + tree[key] + " " + key;
            } else {
                return "tree " + await this.writeTree(tree[key]) + " " + key;
            }
        }));
        const treeObject = treeObjects.join("\n") + "\n";
        // 假设这里是异步写入的逻辑
        try {
            const result = await index.writeObjects(treeObject);
            return result;
        } catch (error) {
            console.error("Error:", error);
            throw error;
        }
    }
```

这段代码是一个异步的`writeTree`方法，用于将给定的树状结构数据写入到某个地方（可能是文件系统或数据库）。该方法递归地处理树状结构，对于字符串类型的值生成“blob”记录，对于子树结构则递归调用自身生成“tree”记录。所有的记录以换行符分隔后组合成一个字符串，然后尝试异步写入。如果写入过程中出现错误，则捕获并抛出该错误。

### **检查是否需要提交**：

判断当前`HEAD`引用的提交对象的树哈希值是否与刚刚创建的树哈希值相同。如果相同，说明工作目录是干净的，没有需要提交的更改，因此抛出错误信息。

- 我们先获取分支名称或描述信息

  在Git中，HEAD可以处于分离状态（detached），这意味着它直接指向一个特定的提交而不是一个分支。当HEAD处于分离状态时，用户所做的提交不会与任何分支相关联，直到这些提交被合并到某个分支或通过创建新分支来保存它们。
  ```js
  const headNameOrDesc = refs.isHeadDetached() ? "detached HEAD" : refs.headBranchName();
  ```
  因为提交的时候会打印信息，所以如果是头指针分离，我们就用"detached HEAD"指代，如果是在某个分支上，我们就获取这个分支的名称。
- 获取HEAD中的提交对象的树哈希
  ```js
   async getCommitTreeHash() {
        const headFilePath = utils.getRepositoryType() === "bare" 
        ? path.join(utils.getGivWorkingDirRoot(), "HEAD")
        : path.join(utils.getGivWorkingDirRoot(), ".gitv/HEAD");
        let commitHash = "";
        

        const headContent = await fs.readFile(headFilePath, 'utf8');  
        if (headContent.startsWith('ref: ')) {  
            const branchName = headContent.replace('ref: ', '').trim();  
            const branchHashPath = utils.getRepositoryType() === "bare" 
                ? path.join(utils.getGivWorkingDirRoot(), "")
                : path.join(utils.getGivWorkingDirRoot(), ".gitv/HEAD");
            commitHash = await fs.readFile(headFilePath, 'utf8'); 
            
          } else {  
            // HEAD处于分离状态，直接指向一个commit  
            commitHash = headContent;
            console.log('HEAD is in detached state, pointing to a specific commit');   
          }

          const objectsHashPath = `${commitHash.substring(0, 2)}/${commitHash.substring(2)}`
          const commitHashPath = utils.getRepositoryType() === "bare" 
                ? path.join(utils.getGivWorkingDirRoot(), `objects/${objectsHashPath}`)
                : path.join(utils.getGivWorkingDirRoot(), `.gitv/objects/${objectsHashPath}`);

          const commitContent = await fs.readFile(headFilePath, 'utf8');
          return commitContent.split(/\s/)[1]; 

    } ```
<!-- ###  **准备提交信息**：

   如果正在进行合并操作，则从`MERGE_MSG`文件中读取默认的合并提交信息；否则，使用调用`commit()`函数时传入的提交信息。
   
   要判断Git是否处于合并状态，可以检查`MERGE_MSG`文件是否存在，并且`MERGE_HEAD`文件是否包含了一个有效的提交哈希值。如果这两个条件都满足，那么可以确信Git当前处于合并状态
   
   ```js
   
   
   
   
   ``` -->

  
      
  
  