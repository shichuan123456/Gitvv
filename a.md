---
theme: fancy
highlight: idea
---
上小节我们从命令的使用、核心概念的讲解、内部原理的剖析三个维度学习了`gitv add`命令，这小节就让我们和大家一起动手实现它吧。

## **代码主框架搭建**

-   添加命令 
      
     在脚本文件`bin/index.js`中添加`git add <pathOrFiles>`命令:
     ```js
        // bin/index.js
        program
          // 添加add命令，有一个必填参数
          .command('add <pathOrFiles>')
          // 给命令添加描述，会在帮助中提示用户
          .description('Add file contents to the index')
          // 命令执行时的回调函数，并接收命令行的参数
          .action((pathOrFiles) => {
              // 调用Gitv类的add实例方法
              gitv.add(pathOrFiles);
        })
     ```
    在实现 `git init [directoryTarget]` 命令时，参数使用的是方括号 `[]`，而现在则是尖括号 `<>`。这是因为方括号 `[]` 表示参数是可选的，而尖括号 `<>` 表示参数是必填的。在 `Commander.js` 内部，会对参数进行校验，并在参数缺失时抛出错误以提示用户。
    
    上节我们知道，`git add` 命令可能带有 `-u`、`-f` 等选项，但今天我们只专注于实现核心功能：`git add file`（单个文件）、`git add path`（特定路径）、`git add .`（当前目录）。因此，我们的命令暂时不接受选项，但我们会在加篇中实现这些选项功能。

-   添加功能模块

    业务功能需要封装在各自的类模块中，所以创建`src/GitvAdd.js`文件，并初始化`GitvAdd`类：
    ```js
    // src/index.js
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
     下面我们在`Gitv`中实例化`GitvAdd`并调用`add`方法实现该命令的功能:  
     ```js
     // src/GitvAdd.js
    const GitvAdd = require("./GitvAdd")
    class Gitv {
      // ...
      add(pathOrfiles) {
         this.gitvAdd  = new GitvAdd(pathOrfiles)
         this.gitvAdd.add();
      }
    }
     ```
    主体框架代码已完成，接下来我们只需要实现`GitvAdd`类的`add`实例方法即可。相信大家对于代码主框架搭建已经完全掌握了，后面章节各功能模块的实现如无特殊处理就不再赘述这部分内容了。
    

## **边界条件处理**
  在进入核心功能实现之前，我们会在`Utils.js`中封装公共方法进行`gitv`命令执行时的约束条件和参数的校验。

-   命令必须在`Gitv`仓库内执行

    回想一下我们在实现`gitv init`命令时所使用的`directoryIsGitvRepo`方法，它的功能是检查指定目录是否是Gitv仓库的工作区的根目录。而今天我们要实现的功能是检查当前目录是否是`Gitv`仓库的工作区或其子目录。简言之，如果当前目录不是Gitv仓库的工作区根目录，我们将继续在其父目录中进行检查，以确保`gitv add`命令可以在`Gitv`仓库的工作区及其所有子目录中运行。
    ```js
    // src/Utils.js
    const path = require("path");
    class Utils {
     // ...
       isInGitvRepo() {
          return this.getGivWorkingDirRoot() !== void 0;
       }

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

    裸仓库（`bare repository`）主要用于共享和集中式协作，其中不包含工作目录。因此，裸仓库不允许执行`git add`命令，因为该命令用于将工作区的文件添加到`index`，而裸仓库没有工作区，无法存储或修改文件。
    
    我们只需读取`Gitv`配置文件中的`bare`字段值，该字段用于标识当前仓库是否为裸仓库。
    ```js
    [core]
	    bare = true  //true即为裸仓库
    ```
    如下，我们在`config`中封装`getConfigObj`方法用来读取`config`文件，并将其转换成对象：

    ```js
       // src/config.js
       const fs = require("fs");
       const utils = require("./Utils") 
       class GitvConfig = {
           // ...
           getConfigObj(){
               try {
                   // 读取配置文件内容
                   const configPath = utils.getGivWorkingDirRoot();
                   const configContent = fs.readFileSync(configPath, 'utf-8');

                   // 匹配配置文件中的配置（sections）的正则
                   const configRegex = /[(.*?)]\s*([\s\S]*?)(?=[|$)/g;
                   // 匹配键值对的正则
                   const keyRegex = /\s*([\w.-]+)\s*=\s*(.*?)(?=$|\n)/g;

                   // 存储解析结果的对象
                   const result = {};

                   // 使用正则表达式匹配配置文件的每个节（section）
                   let match;
                   while ((match = configRegex.exec(configContent)) !== null) {
                     const section = match[1];
                     const sectionContent = match[2];
                     const sectionObj = {};

                     // 使用正则表达式匹配每个节中的键值对
                     let keyMatch;
                     while ((keyMatch = keyRegex.exec(sectionContent)) !== null) {
                       const key = keyMatch[1];
                       const value = keyMatch[2].trim();
                       sectionObj[key] = value;
                     }

                     // 将每个节的键值对保存到最终结果对象中
                     result[section] = sectionObj;
                   }

                   // 返回解析后的对象
                   return result;
                 } catch (error) {
                   // 捕获可能的错误并打印到控制台
                   console.error('Error reading or parsing Gitv config file:', error);
                   return {}; // 返回空对象表示解析失败
                 }
           },
       }
    ```
  -   目标路径判断
   
       当我们指定了参数后，我们指定的参数有可能不在`Gitv`的管理范围内，所以我们还得先需要边界的处理：
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
   
   整体的思路就是将目录或文件统一成绝对路径，如果是在`Gitv`仓库里，那么它的路径一定是以仓库根目录路径开头的。   
   下面我们直接调用刚才封装的方法实现边界条件的检测：
   ```js

    const config = require("./GitvConfig")
    const utils = require("./Utils")
    class GitvAdd { 
       // ...
        add() {
            if(!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
            if(config.getConfigObj()?.core?.bare)  throw new Error("this operation must be run in a Gitv work tree");
        }
    }
```  
   
##  **求文件内容的SHA-1校验和**    
    
  上节我们知道，我们会对文件的内容进行`SHA-1`的哈希作为文件的名称存到`objects`目录文件中，我们同样封装一个`sha1`的方法：
    
```js
const { createHash } = require("crypto");
class Utils { 
    encrypt = (algorithm, content) => {  
        const hash = createHash(algorithm)
        hash.update(content)
        return hash.digest('hex')
    }
    sha1 = (content) => encrypt('sha1', content)
}
```
上面封装了`sha1`的方法，我们重点看下参数`content`，`Git`的`hash`内容是一个`blob`对象，包含三部分：`blob`对象的标志、内容长度和内容，还记得上节我们写入`test.txt`的123，实际的hash内容如下：

  ```js
  "blob 4\x00123\n"  // 标志位blob、长度4（包含\n）、内容123，其中通过进行\x00进行内容的分隔
  ```
我们可以用上面的sha1进行计算得到hash值为 `190a18037c64c43e6b11489df4bf0b9eb6d2c9bf`，和上节我们实验所得的是一致的。

## **核心功能实现**

### **搜集文件**
实现功能的第一步就是要将指定文件或目录下的所有文件搜集到一个数组中，然后依次遍历统一处理。
```js
class Utils { 
     collectFiles = (pathOrfiles) => {
        if (!fs.existsSync(pathOrfiles)) {                      
            return [];
        } else if (fs.statSync(pathOrfiles).isFile()) {         
            return [pathOrfiles];
        } else if (fs.statSync(pathOrfiles).isDirectory()) {  
            // 如果是文件夹，递归搜集
            return fs.readdirSync(pathOrfiles).reduce(function (fileList, dirChild) {
                return fileList.concat(gitv.collectFiles(path.join(pathOrfiles, dirChild)));
            }, []);
        }
    }
}
```
### **更新索引**

接下来我们会更新`index`，会涉及到`index`文件内容的读取和写入，我们再创建一个`Index`类来封装所有相关的操作。
- index的读取
    ```js
    // 读取 index 文件，返回一个包含 index 对象的 Promise
    async  read() {
        const gitvRepoPath = utils.getGivWorkingDirRoot();
        try {
            const idx = {};
            // 创建文件读取流
            const fileStream = fs.createReadStream(this.indexPath);
            const rl = readline.createInterface({
                input: fileStream,
            });

            for await (const line of rl) {
                const lineArray = line.split(/ /);
                idx[index.key(lineArray[0], lineArray[1])] = lineArray[2];
            }

            return idx;
        } catch (err) {
            console.error("Error reading index file:", err);
            return {}; // 返回空对象或者根据需要进行其他处理
        }
    }
    ```
  其中`this.indexPath`是在`constructor`中初始化：
    ```js
    constructor() {
         this.indexPath = config.getConfigObj()?.core?.bare 
                          ? path.join(gitvRepoPath, ".gitv", "index") 
                          : path.join(gitvRepoPath, "index");
    }
    ```
- index的写入
    ```js
     async  write(index) {
            try {
                // 构造索引字符串
                const indexStr = Object.entries(index)
                    .map(([key, value]) => `${key.split(",")[0]} ${key.split(",")[1]} ${value}`)
                    .join("\n") + "\n";

                // 异步写入索引文件
                await writeFileAsync(this.indexPath, indexStr);
            } catch (err) {
                console.error("Error writing index file:", err); // 错误日志
                throw err; // 抛出异常以便调用者处理
            }
        }



    ```

- index的跟新
  由于index是一个文件，要去删除和插入一行而进行文本的匹配可能会有些麻烦，我们转换思路，就如config文件的处理，先把文件完整的读取成一个JS对象，然后进行对象的处理，再写入文本：
  ```js
  async  deleteAndWrite(filePath) {
        try {
            // 异步读取当前 index 文件的内容
            const idx = await index.read();
            // 遍历该文件的所有 stage，进行清除
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
### **核心操作**


在index.js中封装updateIndex进行没有一个文件的更新：
```js
updateIndex(filePath) {
        const isOnDisk = fs.existsSync(filePath);
        if (!isOnDisk) return;
        // 对空的文件夹不进行处理
        if (fs.statSync(filePath).isDirectory()) throw new Error(" is a directory - you should add files inside\n");
        // 获取文件的绝对路径
        const absolutePath = path.join(utils.getGitvPath(), filePath || "");
        // 实现add的核心写入功能
        this.index.writeRm(pathFile);
        // 写入objects对象和index文件
       // this.index.writeObjectsAndIndex(pathFile, 0, fs.readFileSync(absolutePath, "utf-8"));
       // 同样先读取index文件对象
        var idx = index.read();
        // 写入objexts对象，和添加idx对象
        idx[index.key(path, stage)] = objects.write(content);
        // 将最终结果写入index
        index.writeObjects(idx);
        return "\n";
    }
```

封装writeObjects 

```js
writeObjects(content) {
            // 将content通sha1进行blob的计算，这个之前小节有详解
            const blob = utils.sha1(content);
            // 写入objects对象，在objects文件夹下，以blob为名，content为内容
            utils.write(path.join(path.join(utils.getGitvPath(), ".gitv"), "objects", blob), content);
            // 写入之后，返回blob，方便index的写入
            return blob;
    }
```

为了简明核心，我们这块的处理和Git稍有不同。在Git中，内容是进行压缩的，还有就是objects的存储是blob值的前位为文件夹存储的。我们为了方便就不做上述的处理了。

至此add的核心功能就已经实现了，add的核心逻辑就是写入objects和记录index文件，为commit做好准备。下节我们看下commit的相关内容。