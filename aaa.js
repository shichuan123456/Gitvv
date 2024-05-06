const path = require("path");
const gitConfigObject = {
    core: {
      repositoryformatversion: 0,
      filemode: false,
      bare: false,
      logallrefupdates: true,
      symlinks: false,
      ignorecase: true
    },
    remote: {
      origin: {
        url: 'http://101.192.739.2146:8190/fds-fdsfe-repository.git',
        fetch: '+refs/heads/*:refs/remotes/origin/*'
      }
    },
    branch: {
      master: {
        remote: 'origin',
        merge: 'refs/heads/master'
      }
    }
  };
  
// 将 JavaScript 对象转换为 Git 配置文件字符串的方法
function objToGitConfigString(obj) {
    let result = '';
  
    // 遍历对象的每个部分
    for (const section in obj) {
      result += `[${section}`;  // 输出配置的部分，如 "[core]"、"[remote "origin"]"
      
      // 如果当前部分是 "remote"，则追加远程仓库的名称，如 "origin"
      if (section === 'remote') {
        result += ` "${Object.keys(obj[section])[0]}"`;
      }
      
      result += `]\n`;
  
      // 遍历当前部分的键值对
      for (const key in obj[section]) {
        const value = obj[section][key];
  
        // 如果值是对象，则继续遍历并输出键值对
        if (typeof value === 'object') {
          for (const subKey in value) {
            result += `  ${subKey} = ${value[subKey]}\n`;
          }
        } else {
          // 否则，直接输出键值对
          result += `  ${key} = ${value}\n`;
        }
      }

      result += '\n';  // 添加换行，以区分不同部分
    }
  
    return result.trim(); // 移除末尾可能存在的多余换行
  }
  
  // Convert object to Git config string
  const gitConfigString = objToGitConfigString(gitConfigObject);

  

  // Write string to file (example using Node.js fs module)
  const fs = require('fs');
  const filePath = process.cwd();
  
  console.log(gitConfigObject, "------------------------------------", filePath);
  fs.writeFileSync(path.join(filePath, "aaa.txt"), gitConfigString);