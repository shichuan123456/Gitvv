
在之前的章节中，我们深入学习了如何使用 `git commit` 命令来记录项目的变化，以及如何利用 `git merge` 来整合不同分支上的工作。我们明白了每一次的 `commit` 都是项目历史中不可或缺的一部分，记录了项目从起步到成长的每一个足迹。那么，当我们想要回顾这些足迹，查询仓库的 `commit` 历史记录时，应该怎么做呢？答案就是使用 `git log` 命令。

`git log` 是 `Git` 中的一个核心命令，它为我们提供了一个强大的工具来浏览项目的所有提交。每一次提交都会在这里留下它的印记，包括独特的哈希值、作者信息、提交日期以及提交说明。这些信息不仅可以帮助我们回顾项目的成长历程，还能帮助我们理解代码变更的上下文，从而更好地维护和管理项目。

## **`git log`的基本使用**

1. 默认输出
当你直接运行 `git log` 命令时，`Git` 会以默认格式显示提交历史。每个提交都会显示一行摘要信息，包括提交的哈希值（`commit hash`）、作者（`Author`）、日期（`Date`）和提交说明（`commit message`）。
`
    ```bash
    $ git log  
    commit 1234567890abcdef1234567890abcdef12345678  
    Author: John Doe <john.doe@example.com>  
    Date:   Mon Mar 1 21:39:13 2023 +0800  

        Add feature X  

    commit 9876543210fedcba9876543210fedcba98765432  
    Author: Jane Smith <jane.smith@example.com>  
    Date:   Fri Feb 28 15:20:34 2023 +0800  

        Fix bug Y  

    # ... 更多的提交信息
    ```
2. 限制输出数量
使用 -n 或 --max-count 选项可以限制显示的提交数量。例如，要显示最近的3个提交，可以使用以下命令：
    ```bash
    $ git log -n 3  
    # 或者  
    $ git log --max-count=3
    ```
3. 定制输出格式
使用 --pretty 选项可以定制 git log 的输出格式。例如，使用 oneline 格式可以只显示提交的哈希值和提交说明，每行一条信息：

    ```bash
    $ git log --pretty=oneline  
    1234567890abcdef1234567890abcdef12345678 Add feature X  
    9876543210fedcba9876543210fedcba98765432 Fix bug Y  
    # ... 更多的提交信息
    ```
   你还可以使用自定义的格式字符串来显示你想要的任何信息。例如，以下命令将显示提交的哈希值、作者和提交说明：

    ```bash
    $ git log --pretty=format:"%h - %an, %ar : %s"  
    1234567 - John Doe, Mon Mar 1 21:39:13 2023 +0800 : Add feature X  
    9876543 - Jane Smith, Fri Feb 28 15:20:34 2023 +0800 : Fix bug Y  
    # ... 更多的提交信息
    ```
其中，%h 表示提交的简短哈希值，%an 表示作者姓名，%ar 表示作者日期（相对格式），%s 表示提交说明。

4. 搜索提交
使用 --grep 选项可以在提交说明中搜索特定的关键词或模式。例如，要搜索包含 "feature" 的提交，可以使用以下命令：

```bash
$ git log --grep="feature"
```

5. 一行格式显示
用于查看提交历史，但以一种更简洁的方式显示。这个命令会列出每一个提交的哈希值（通常是简短的几个字符）以及对应的提交信息的第一行。

```bash
$ git log --oneline
1234567 Add feature X  
9876543 Fix bug Y
```

6. 显示合并提交
默认情况下，git log 会隐藏合并提交（`merge commits`）。如果你想要显示它们，可以使用 `--merges` 选项：

```bash
$ git log --merges
```

7. 显示图形化的提交历史

虽然 `git log` 本身以文本形式显示提交历史，但你可以结合其他工具（如 `gitk` 或 `git log --graph`）以图形化的方式查看提交历史。

使用 `--graph` 选项可以在控制台中显示一个简化的 ASCII 图形来表示分支和合并：

```bash
$ git log --graph --oneline  
* 1234567 (HEAD -> master) Add feature X  
*   9abcefd Merge branch 'feature-branch'  
|\  
| * 7654321 Commit on feature-branch  
|/  
* 9876543 Fix bug Y  
# ... 更多的提交信息
```
以上只是 git log 的一些基本用法。通过结合不同的选项和参数，你可以根据自己的需求定制 git log 的输出，以便更好地浏览和理解项目的提交历史。

## **三、需求分析**

### **概述实现目标**

`git log` 的本质在于对 `Git` 仓库中的对象数据库进行遍历和查询，以检索和展示提交历史。Git 使用了一个基于内容的寻址系统（`content-addressable system`），其中每个对象（如提交、树、文件等）都有一个唯一的哈希值（`SHA-1` 哈希，尽管 `Git` 正在逐步迁移到 `SHA-256`）。这些对象以键值对的形式存储在对象数据库中，其中键是对象的哈希值，值是对象的实际内容。

当执行 `git log` 命令时，`Git` 会从某个指定的提交（通常是 `HEAD`）开始，并遍历该提交所引用的父提交，从而构建一个提交历史的图。然后，`Git` 会根据用户提供的选项和参数来过滤和排序这些提交，并将它们以适当的格式输出到终端或其他地方。

### **命令实现详细剖析与实现**

接下来，我们将对 `gitv log` 的各个命令的实现进行详细的剖析，包括它们的语法、参数、使用场景以及注意事项等，并逐个实现。

### 初始化命令结构

首先，我们需要在 `bin/index.js` 中定义 `gitv log` 命令及其选项。确保了能够通过命令行接口使用我们的 `gitv log` 命令。

```js
// bin/index.js
program  
    .command('log')  
    .description('Show commit logs')  
    .option('-n, --number <number>', 'Number of commits to show', parseInt) // 将输入的字符串转换为整数  
    .option('--oneline', 'Show each commit on a single line')  
    .option('--graph', 'Draw a text-based graph of the commit history')  
    .action((options) => {   
    gitv.log(options); 
    }); 
```
###  添加功能模块

  我们新建`src/GitvRemote.js`文件，并初始化`GitvRemote`类：

```js
// src/GitvRemote.js
class GitvLog {
    constructor(options) {
        this.options = options;
    }
    async log() {
        // 必须是Gitv仓库
        if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository"); 
        console.log(`gitv remote execute ${this.url}----${JSON.stringify(this.options)}`);
    }
}
module.exports = GitvRemote;
```
在使用 `gitv log` 命令时，同样必须确保当前正处于 `Gitv` 仓库的上下文中。值得注意的是，即便是在裸仓库（`bare repository`）中，命令依然有效。尽管裸仓库没有工作目录，但 `gitv log` 命令仍然可以访问并显示提交历史。这是因为 `git log` 命令是从 `.git` 目录中的对象数据库中读取提交信息的，而不需要工作目录中的文件。

### **实现 gitv log**


