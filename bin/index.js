#!/usr/bin/env node

const commander = require('commander')
const pkg = require('../package.json')
const Gitv = require('../src/Gitv.js')


const program = new commander.Command("gitv")

program.usage('[command] [options]')
program.version(pkg.version)

const gitv = new Gitv()

program
  // 添加int 命令，有一个可选的参数
  .command('init [directoryTarget]')
  // 给这个命令添加描述，会在帮助中提示用户
  .description('Initialize a new Gitv repository')
  // 给init命令添加bare参数
  .option('--bare', 'Initialize a bare Gitv repository')
  // 当执行这个命令的时候会执行的回调函数，可接收命令行的参数
  .action((directoryTarget = "", options) => {
    // 具体的命令逻辑, 其中directoryTarget和options分别是该命令接收的参数和选项
    gitv.init(directoryTarget, options)
  })

program
  // 添加add命令，有一个必填参数
  .command('add <pathOrFile>')
  // 给命令添加描述，会在帮助中提示用户
  .description('Add files contents to the index')
  // 命令执行时的回调函数，并接收命令行的参数
  .action((pathOrFile) => {
    // 调用Gitv类的add实例方法
    gitv.add(pathOrFile);
  })

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
    gitv.commit(options);
  })

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

program  
  .command('remote [url]')  
  .description('Manage remote repositories')  
  .option('-v, --verbose', 'Be verbose and show detailed information')  
  .option('--add <name> <url>', 'Add a new remote repository')  
  .option('--remove <name>', 'Remove an existing remote repository')  
  .option('--set-url <name> <url>', 'Change the URL of an existing remote repository')  
  .option('--rename <oldName> <newName>', 'Rename an existing remote repository')  
  .action((url, options) => { 
    gitv.remote(url, options); // 这里应该打印出包含所有选项和参数的对象
  });

  // 定义 gitv log 命令  
program  
.command('log')  
.description('Show commit logs')  
.option('-n, --number <number>', 'Number of commits to show', parseInt) // 将输入的字符串转换为整数  
.option('--oneline', 'Show each commit on a single line')  
.option('--graph', 'Draw a text-based graph of the commit history')  
.action((options) => {   
  gitv.log(options); 
});  

program
  .command('clone [remote_repository_url] [local_directory]')
  .description('Clone a remote repository to the local machine')
  .action((remoteRepositoryUrl, localDirectory) => {
    gitv.clone(remotePath, targetPath)
  })

program.parse()