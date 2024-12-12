#!/usr/bin/env node

const commander = require('commander')

const Gitv = require('../src/Gitv.js')


const program = new commander.Command("gitv")

program.usage('[command] [options]')
program.version(require("../package.json").version)

const gitv = new Gitv()

program
  // 添加int 命令，有一个可选的参数
  .command('init [directoryTarget]')
  // 给这个命令添加描述，会在帮助中提示用户
  .description('Initialize a new Gitv repository')
  // 给init命令添加bare参数
  .option('--bare', 'Initialize a bare Gitv repository')
  // 当执行这个命令的时候会执行的回调函数，可接收命令行的参数
  .action((directoryTarget, options) => {
    // 具体的命令逻辑, 其中directoryTarget和options分别是该命令接收的参数和选项
    try {
      console.log("bin");
      
      gitv.init(directoryTarget, options)
    } catch (error) { 
      console.error(`Failed to initialize Gitv repository. Error details:`, error);
    }
  })

// program
//   // 添加add命令，有一个必填参数
//   .command('add <pathOrFile>')
//   // 给命令添加描述，会在帮助中提示用户
//   .description('Add files contents to the index')
//   // 命令执行时的回调函数，并接收命令行的参数
//   .action((pathOrFile) => {
//     // 调用Gitv类的add实例方法
//     try {
//       gitv.add(pathOrFile);
//     } catch (error) {
//       console.error(`Failed to add '${pathOrFile}' to the Gitv repository. Error details:`, error);
//     }
//   })

// program
//   .command('rm <fileOrPath>')
//   .description('Remove files from the working directory and the index')
//   .option('--cached', 'Remove files from the index only')
//   .option('-f', 'Force removal of files from both working directory and index')
//   .option('-r', 'Recursively remove files and directories')
//   .action((fileOrPath, options) => {
//     try {
//       gitv.rm(fileOrPath, options)
//     } catch (err) {
//       console.error(`Failed to remove '${fileOrPath}' from the Gitv repository. Error details:`, err);
//     }
//   })

// program
//   .command('commit')
//   // 添加 -m 或 --message 选项，并设置描述
//   .option('-m, --message <message>', 'commit message')
//   // 添加命令描述
//   .description('Record changes to the repository')
//   .action((options) => {
//     // 检查 -m 参数是否已提供并且不为空  
//     try {
//       if (!options.message || options.message.trim() === '') {
//         console.error('Error: Commit message is required and cannot be empty.');
//         process.exit(1); // 退出程序并返回错误码 1  
//       }
//       gitv.commit(options);
//     } catch (err) {
//       console.error(`Failed to commit changes to the Gitv repository. Error details:`, err);
//     }
//   })

// program
//   .command('branch [branchName]')
//   .description('Manage branches within the local Git repository')
//   .option('-r, --remote', 'List all remote branches')
//   .option('-v, --verbose', 'Be verbose and show commit details along with branch names')
//   .option('-a, --all', 'List all branches, both local and remote')
//   .option('-D, --delete', 'Delete an existing branch (must be merged or force with -D)') //TODO
//   .option('-m, --move <newBranch>', 'Rename a branch')
//   .action((branchName, options) => {
//     try {
//       gitv.branch(branchName, options);
//     } catch (err) {
//       console.error(`Failed to create or modify the branch '${branchName}' in the Gitv repository. Error details:`, err);
//     }
//   });

// program
//   .command('remote [url]')
//   .description('Manage remote repositories')
//   .option('-v, --verbose', 'Be verbose and show detailed information')
//   .option('--add <name> <url>', 'Add a new remote repository')
//   .option('--remove <name>', 'Remove an existing remote repository')
//   .option('--set-url <name> <url>', 'Change the URL of an existing remote repository')
//   .option('--rename <oldName> <newName>', 'Rename an existing remote repository')
//   .action((url, options) => {
//     try {
//       gitv.remote(url, options);
//     } catch (err) {
//       console.error("An error occurred while interacting with Gitv remotes. Error details:", err);
//     }
//   });

// // 定义 gitv log 命令  
// program
//   .command('log')
//   .description('Show commit logs')
//   .option('-n, --number <number>', 'Number of commits to show', parseInt) // 将输入的字符串转换为整数  
//   .option('--oneline', 'Show each commit on a single line')
//   .option('--graph', 'Draw a text-based graph of the commit history')
//   .action((options) => {
//     try {
//       gitv.log(options);
//     } catch (err) {
//       console.error(`Failed to retrieve Git log. Error details:`, err);
//     }
//   });

// program
//   .command('merge')
//   .description('Merge a branch into the current branch')
//   .argument('<branch>', 'The branch to merge into the current branch')
//   .action((branch) => {
//     try {
//       gitv.merge(branch)
//     } catch (error) {
//       console.error(`Error merging ${branch}:`, error);
//     }
//   });

// program
//   .command('clone [remote_repository_url] [local_directory]')
//   .description('Clone a remote repository to the local machine')
//   .action((remoteRepositoryUrl, localDirectory) => {
//     gitv.clone(remotePath, targetPath)
//   })

// // 定义 gitv status 命令
// program
//   .command('status')
//   .description('Show the status of the repository')
//   .action(() => {
//     gitv.status();
//   });

program.parse()