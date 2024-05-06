---
theme: fancy
highlight: idea
---
在上一小节中，我们深入学习了 `gitv add` 命令，内容包括命令的使用、核心概念的讲解，以及内部原理的剖析。接下来，让我们一起动手实现这个命令吧！

## **1、代码主框架搭建**

-   添加命令 
      
     在脚本文件`bin/index.js`中添加`gitv add <pathOrFile>`命令:
     ```js
        // bin/index.js
        const Gitv = require('../src/Gitv.js')
        const gitv = new Gitv()
        program
          // 添加add命令，接收一个必填参数
          .command('add <pathOrFile>')
          // 给命令添加描述，会在帮助中提示用户
          .description('Add files contents to the index')
          // 命令执行时的回调函数，并接收命令行的参数
          .action((pathOrFile) => {
              // 调用Gitv类的add实例方法
              gitv.add(pathOrFile);
        })
     ```
    在实现 `gitv init [directoryTarget]` 命令时，参数使用的是方括号 `[]`，而现在则是尖括号 `<>`。方括号 `[]` 表示参数是可选的，而尖括号 `<>` 表示参数是必填的，在 `Commander.js` 内部，会对参数进行校验，如果参数缺失则会抛出错误以提示用户。
    
    上节我们知道，`git add` 命令可能带有 `-u`、`-f` 等选项，但今天我们只专注于实现核心功能：`gitv add file`（单个文件）、`gitv add path`（特定路径）、`gitv add .`（当前目录）。因此，我们的命令暂时不接收选项，但我们会在加篇中实现这些选项功能。

-   添加功能模块

    业务功能需要封装在各自的类模块中，所以我们新建`src/GitvAdd.js`文件，并初始化`GitvAdd`类：
    ```js
    // src/GitvAdd.js
    class GitvAdd { 
        constructor(pathOrfiles) {
            // 接收命令参数
            this.pathOrfiles = pathOrfiles
        }
        // 具体实现add命令的业务逻辑
        add() {
        }
    }
    module.exports = GitvAdd;
    ```
     下面我们在`Gitv`中实例化`GitvAdd`并调用`add`方法实现该功能:  
     ```js
     // src/Gitv.js
    const GitvAdd = require("./GitvAdd")
    class Gitv {
      // ...
      add(pathOrfile) {
         this.gitvAdd  = new GitvAdd(pathOrfile)
         this.gitvAdd.add();
      }
    }
     ```
    主体框架代码已完成，接下来我们只需要实现`GitvAdd`类的`add`实例方法即可。相信大家对于代码主框架搭建已经完全掌握了，后面章节各功能模块的实现如无特殊处理就不再赘述这部分内容了。
    

## **2、边界条件处理**
  在进入核心功能实现之前，我们会在`Utils.js`中封装公共方法进行`gitv`命令执行时的约束条件和参数的校验。

-   命令必须在`Gitv`仓库内执行

    回想一下我们在实现`gitv init`命令时所使用的`directoryIsGitvRepo`方法，它的功能是检查指定目录是否是`Gitv`仓库的工作区的根目录。而今天我们要实现的功能是检查当前目录是否是`Gitv`仓库的工作区或其子目录。简言之，如果当前目录不是`Gitv`仓库的工作区根目录，我们将继续在其父目录中进行检查，以确保`gitv add`命令可以在`Gitv`仓库的工作区及其所有子目录中运行。
    ```js
    // src/Utils.js
    const path = require("path");
    class Utils {
       // 命令是否实在Gitv仓库内执行
       isInGitvRepo() {
          return this.getGivWorkingDirRoot() !== void 0;
       }
       // 获取Gitv仓库的工作区的更目录
      getGivWorkingDirRoot() {
        let dir = process.cwd(); // 当前命令执行目录
        // 从dir开始依次向上查找直到找到或到目录的顶层
        while (!this.directoryIsGitvRepo(dir) && path.parse(dir).root !== path.resolve(dir)) {
            dir = path.join(dir, ".."); // 获取上一级目录
        }
        return this.directoryIsGitvRepo(dir) ? dir : void 0;
      }
    }
    ```
-   不能是裸仓库

    裸仓库（`bare repository`）主要用于共享和集中式协作，其中不包含工作目录。因此，裸仓库不允许执行`gitv add`命令，因为该命令用于将工作区的文件添加到`index`，而裸仓库没有工作区，无法存储或修改文件。
    
    我们在`Utils.js`中封装`getRepositoryType`进行仓库类型的获取：
    ```js
    getRepositoryType() {
        //获取工作区根目录
        const dirRoot = this.getGivWorkingDirRoot()   
        // 指定目录的仓库类型获取，封装init命令时已经实现
        return this.getRepositoryTypeFromDirectory(dirRoot)  
    }
    ```
  -   目标路径判断
   
       命令指定了路径参数后，路径有可能不在`Gitv`的管理范围内，所以我们对参数进行范围校验：
       ```js
       //src/Utils.js
        const path = require("path")
        class Utils {
            // ...
            isSubdirectory(parentPath, childPath) {
                // 统一成绝对路径
                const normalizedChild = path.isAbsolute(childPath) ? childPath : (childPath === '.' ? path.resolve(childPath):                                                                                 path.join(process.cwd(), childPath))
                const normalizedParent = path.resolve(parentPath);
                return normalizedChild.startsWith(normalizedParent);
            }
      ```
   
      实现的思路就是将目录或文件统一成绝对路径，如果是在`Gitv`仓库里，那么它的路径一定是以仓库根目录路径开头的。   
     下面我们统一调用刚才封装的校验方法实现边界条件的检测：
      ```js
        // src/GitvAdd.js 
        const utils = require("./Utils")
        class GitvAdd { 
           // ...
           add() {
                // 必须是Gitv仓库
                if(!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
                // 不能是裸仓库
                if(utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
                // 单数路径必须是Gitv仓库的工作目录的根目录下
                if(!utils.isSubdirectory(utils.getGivWorkingDirRoot(), this.pathOrfiles)) throw new Error("target file or path is outside gitv repository")
            }
        }
      ```  
## **3、核心功能实现**
###  ***3.1获取文件内容的SHA-1哈希值***   
    
  上节我们知道，`Gitv`会将文件的内容进行`SHA-1`的哈希作为文件的名称存到`objects`目录中，我们封装一个通用`sha1`的方法：
    
```js
const { createHash } = require("crypto");
class Utils { 
    // 加密方法，使用指定算法对内容进行加密
    encrypt = (algorithm, content) => {
        // 创建一个哈希对象，使用指定的算法
        const hash = createHash(algorithm);
        // 更新哈希对象的内容为指定的内容
        hash.update(content);
        // 返回加密后的内容的十六进制表示
        return hash.digest('hex');
    }
    // SHA-1 加密方法，调用encrypt对内容进行 SHA-1 加密
    sha1 = (content) => encrypt('sha1', content)
}
```
上面封装了`sha1`的方法，我们重点看下参数`content`，实际上`Git`的`hash`内容是一个经过加工之后的`blob`对象，包含三部分：对象的标识`blob`、内容长度和内容本身，还记得上节我们写入`hello.txt`文件的`hello`，实际的hash内容如下：

  ```js
  "blob 6\x00hello\n"
  // 标志位blob、长度6（包含\n）、内容hello，其中通过进行\x00进行内容的分隔
  ```
我们用上面的`sha1`进行计算得到`hash`值为 `ce013625030ba8dba906f756967f9e9ca394464a`，和上节我们实验所得是一致的。
###  ***3.2构造写入objects中文件内容***

```js
// src/Utils.js
createGitBlob = (content) => {
    const contentLength = Buffer.byteLength(content, 'utf8');
    const blobHeader = `blob ${contentLength}\x00`;
    const blobString = `${blobHeader}${content}`;
    return blobString;
}
```
`createGitBlob`根据文件的原始内容构造对应的`blob`对象。

### ***3.3搜集文件***
`git add <pathOrFile>` ，我们需要将参数指定文件或目录下的所有文件收集到一个数组中，然后逐个进行处理。
```js
// src/Utils
const fs = require("fs");
class Utils { 
     collectFiles = async (pathOrFile) => {
         try {
                const stats = await fs.stat(pathOrFiles);

                if (!stats.isDirectory()) {
                    // 如果不是目录，直接返回当前文件
                    return [pathOrFiles];
                }

                // 递归搜集文件
                const files = await fs.readdir(pathOrFiles);
                const fileList = await Promise.all(files.map(async (file) => {
                    const filePath = path.join(pathOrFiles, file);
                    const fileStats = await fs.stat(filePath);
                    if (fileStats.isDirectory()) {
                        // 如果是目录，递归搜集
                        return collectFiles(filePath);
                    } else {
                        // 如果是文件，直接返回文件路径
                        return filePath;
                    }
                }));            
                // 展平嵌套的数组结构
                return fileList.flat();
            } catch (err) {
                console.error("Error collecting files:", err);
                return [];
            }
      }
}
```
上面封装的 `collectFiles` 方法会统一处理参数，对于文件直接返回包含该文件的数组，对于目录和`.`（执行命令时的当前工作目录），则会递归搜集所有子目录中的文件。

下面，我们在`GitvAdd`中的`add`方法中调用上面封装的方法获取文件数组并依次进`index`的更新。
```js
const utils = require("./Utils")
class GitvAdd {
   add() {
   // 将参数统一化成绝对路径
    const gitvDir = path.isAbsolute(this.pathOrfile)? this.pathOrfile : path.join(process.cwd(), this.pathOrfile)
    utils.collectFiles(gitvDir)
            .then(files => {
               // 如果没有找到任何文件，则报错提示用户
                if(files.length === 0)  throw new Error("not match any fiels")
                files.forEach(file => {
                    // 调用index的updateIndex方发进行index的更新
                    index.updateIndex(file)
                });
            })
            .catch(error => {
                console.error("Error:", error);
            });
   }
}
```
大家发现上面代码中有一行`index.updateIndex(file)`我们还未实现，由于更新`index`，会涉及到`index`文件内容的读取和写入等操作，我们统一创建一个`Index`类来封装`index`相关的所有操作。
### ***3.4 Index功能封装*** 
由于 `index` 是一个文件，直接对其内容进行删除和插入操作会比较繁琐。为了简化处理流程，我们可以借鉴对 `config` 文件的处理方式，先将文件的完整内容读取为一个 `JavaScript` 对象，然后对该对象进行操作。等操作完成，我们再将修改后的对象转换为文本格式，重新写入到 `index` 文件中。新建`GitvIndex.js`并初始化`GitvIndex`类：
- `index`的读取
    ```js
    const utils = require("./Utils")
    class GitvIndex {
        constructor() {
            const gitvRepoPath = utils.getGivWorkingDirRoot();
            this.indexPath = utils.getRepositoryType() === "bare"
             ? path.join(gitvRepoPath, "index") 
             : path.join(gitvRepoPath, ".gitv", "index") 
        }
        // 读取 index 文件，返回一个包含 index 对象的 Promise
        async read() {
            try {
                // 存储索引文件内容的对象
                const idx = {};
                // 创建文件读取流
                const fileStream = fs.createReadStream(this.indexPath);
                const rl = readline.createInterface({
                    input: fileStream,
                });

                // 逐行读取索引文件内容
                for await (const line of rl) {
                    if (!line) continue; // 跳过当前循环，不进行处理
                    const lineArray = line.split(/ /);
                    // 文件名和状态作为key唯一标识blob
                    idx[lineArray[0] + "," + lineArray[1]] = lineArray[2];
                }
                return idx;
            } catch (err) {
                console.error("Error reading index file:", err);
                return {}; // 返回空对象或者根据需要进行其他处理
            }
        }
    }
    ```
 之前我们已经了解到索引文件（`index file`）中包含了一列名为 `stage number` 的字段，用于标识冲突，默认值为 0。在后续实现 `merge` 命令时，我们将会详细说明。在这里，我们只需知道一个 `blob` 对象需要名称联合 stage number 共同来唯一标识即可。
- `index`的写入

   `index`的写入只需要遍历对象，拼接字符串并写入文件即可。
    ```js
     // src/GitvIndex.js
     const writeFileAsync = require('util').promisify(fs.writeFile);
     async write(index) {
        try {
            // 构造索引字符串
            const indexStr = Object.entries(index)
                .map(([key, value]) => `${key.split(",")[0]} ${key.split(",")[1]} ${value}`)
                .join("\n") + "\n";
            // 异步写入索引文件
            await writeFileAsync(this.indexPath, indexStr);
            console.log("Index file has been successfully written."); 
        } catch (err) {
            console.error("Error writing index file:", err);
            throw err; 
        }
    }
    ```

- `index`的更新

  更新的逻辑如前所述：先读取`index`, 然后删除所有该文件在`index`中的记录，然后再写入`index`:
  ```js
  async  deleteAndWrite(filePath) {
        try {
            // 异步读取当前 index 文件的内容
            const idx = await index.read();
            // 遍历该文件的所有 stage，进行清除, stage number和合并的冲突有关我们后续会做深入的讲解
            [0, 1, 2, 3].forEach(stage => {
                delete idx[index.key(filePath, stage)];
            });
    
            // 异步进行写入
            await index.write(idx);
        } catch (err) {
            console.error("Error deleting and writing index file:", err);
            // 根据实际情况处理错误，例如抛出异常或者返回错误信息
            throw err;
        }
    }
  ``` 
- `objects`写入

封装`writeObjects`，将文件内容写入`objects`目录中，然后`hash`会截取前两位作为文件夹的名称，剩余作为文件名，文件的内容会进行`gzip`压缩。

```js
const writeFileAsync = require('util').promisify(fs.writeFile)
const path = require("path")
const fs = require("fs")
const zlib = require("zlib")
const gzip = util.promisify(zlib.gzip);
async  writeObjects(objectsDir, content) {
    const blob = utils.sha1(content)
    // 提取文件夹名称
    const folderName = blob.substring(0, 2)
    // 构建文件夹路径
    const folderPath = path.join(objectsDir, folderName)
    try {
        // 检查文件夹是否存在
        await fs.promises.access(folderPath)
    } catch (err) {
        // 如果文件夹不存在，则创建文件夹
        await fs.promises.mkdir(folderPath)
    }
    // 构建文件路径
    const filePath = path.join(folderPath, blob.substring(2))
    // 写入文件内容
    await writeFileAsync(filePath, await gzip(content))
    // 返回的blob会写入index中
    return blob
  }
```
### ***3.5 Index更新功能实现***
在上面搜集文件部分，我们调用了`index.updateIndex(filePath)`方法，现在`index`的基本操作已封装完成，我们就来具体实现这个方法：  
```js
// src/index.js
const path = require("path")
const fs = require("fs")
const utils = require("./Utils")
updateIndex(filePath) {
    const isOnDisk = fs.existsSync(filePath);
    const stage = 0; // 默认为0 
    if (!isOnDisk) return; // 文件不存在直接返回
    var idx = await this.read();  // 读取idx
    // objects文件夹目录
    const objectsDir = utils.getRepositoryType() === "bare" 
                     ? path.join(utils.getGivWorkingDirRoot(), "objects") 
                     : path.join(utils.getGivWorkingDirRoot(), ".gitv/objects");
   // 构造idx对象
   idx[filePath + "," + stage] = await this.writeObjects(objectsDir,     
   utils.createGitBlob(fs.readFileSync(filePath, "utf-8")));
   await this.write(idx);
}
```

至此`gitv add`的核心功能就已经实现了，其核心逻辑就是写入`objects`和记录`index`文件，为`commit`做好准备。下节我们看下`gitv commit`的相关内容。