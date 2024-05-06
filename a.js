function simulateGitRemoteV(remotesConfig) {  
    let output = '';  
    for (const remoteName in remotesConfig) {  
        const remoteInfo = remotesConfig[remoteName];  
        const fetchUrl = remoteInfo.url; // 通常用于fetch操作  
        const pushUrl = remoteInfo.pushurl || fetchUrl; // 如果没有指定pushurl，则使用fetchUrl  
        output += `${remoteName}\t${fetchUrl} (fetch)\n`;  
        output += `${remoteName}\t${pushUrl} (push)\n`;  
    }  
    return output;  
}  

// // 示例对象，包含远程仓库信息  
// const remotesConfig = {  
// origin: {  
//     url: "http://10.1.236.106/Bfds/fdsf/fds.git",  
//     fetch: "+refs/heads/*:refs/remotes/origin/*",  
//     pushurl: "http://10.1.236.107/other/repo.git"  
// },  
// second: {  
//     url: "http://10.1.236.146/Bfds/fdsf/fds.git",  
//     fetch: "+refs/heads/*:refs/remotes/second/*"  
//     // 注意：这里没有指定pushurl，所以将使用url作为push操作的URL  
// }  
// };  

// // 调用函数模拟 git remote -v 的输出  
// const simulatedOutput = simulateGitRemoteV(remotesConfig);  
// console.log(simulatedOutput);


// const fs = require('fs');  
  
// // 读取配置文件内容  
// const filePath = '.gitv/config'; // 替换为您的配置文件实际路径  
// const configContent = fs.readFileSync(filePath, 'utf8');  
  
// // 初始化配置对象  
// const configObject = {};  
  
// // 临时变量，用于存储当前正在处理的section  
// let currentSection = null;  
  
// // 分割配置文件内容为行  
// const lines = configContent.split('\n');  
  
// // 遍历每一行配置  
// lines.forEach(line => {  
//     // 去除行首尾的空格和换行符  
//     const trimmedLine = line.trim();  
  
//     // 忽略空行和注释行  
//     if (!trimmedLine || trimmedLine.startsWith('#')) {  
//         return;  
//     }  
  
//     // 检查是否是section标题  
//     if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {  
//         currentSection = trimmedLine.slice(1, -1); // 更新当前处理的section  
//         configObject[currentSection] = []; // 为新section初始化空数组  
//     } else {  
//         // 解析键值对  
//         let [key, value] = trimmedLine.split('=');  
//         key = key.trim();  
//         value = value.trim().replace(/\"/g, ''); // 去除值两边的引号  
  
//         // 将键值对添加到当前section的数组中  
//         if (currentSection) {  
//             configObject[currentSection].push({ key, value });  
//         }  
//     }  
// });  
  
// // 输出解析后的配置对象  
// console.log(configObject);



const fs = require('fs');
const path = require('path');

// 读取 Git 配置文件
function read() {
    // const gitConfigFile = utils.getResourcePath('config'); 
    // const configContent = fs.readFileSync(gitConfigFile, 'utf-8');
    const configContent = fs.readFileSync(path.join(__dirname, '.gitv/config'), 'utf8'); 

    // 存储最终结果的对象
    const config = {};
    let currentSection = null;
    let subSection = null;

    // 将文件按行分割
    const lines = configContent.split('\n');

    // 处理每一行
    lines.forEach((line) => {
        // 去掉前后的空格
        line = line.trim();

        // 跳过空行和注释
        if (!line || line.startsWith(';') || line.startsWith('#')) {
            return;
        }

        // 检查是否是一个新的节(section)
        if (line.startsWith('[') && line.endsWith(']')) {
            currentSection = line.slice(1, -1).trim(); // 获取节名称并去除引号
            currentSection = currentSection.replace(/['"]/g, ''); // 移除引号
            subSection = null;

            // 检查节名是否包含空格，处理嵌套节
            if (currentSection.includes(' ')) {
                let [parentSection, innerSection] = currentSection.split(' ', 2);

                // 确保父节存在，并去掉引号
                parentSection = parentSection.replace(/['"]/g, '');
                innerSection = innerSection.replace(/['"]/g, '');

                if (!config[parentSection]) {
                    config[parentSection] = {};
                }

                // 确保子节存在
                if (!config[parentSection][innerSection]) {
                    config[parentSection][innerSection] = {};
                }

                currentSection = parentSection; // 设置父节
                subSection = innerSection; // 设置子节
            } else {
                // 确保单个节存在
                if (!config[currentSection]) {
                    config[currentSection] = {};
                }
            }
        } else if (currentSection) {
            // 处理键值对
            const [key, ...valueParts] = line.split('=');
            const keyTrimmed = key.trim();
            const value = valueParts.join('=').trim(); // 合并可能有多个 "=" 的值

            if (subSection) {
                config[currentSection][subSection][keyTrimmed.replace(/['"]/g, '')] = value; // 添加键值对到子节
            } else {
                config[currentSection][keyTrimmed.replace(/['"]/g, '')] = value;
            }
        }
        console.log( config);
    })
}
// 输出解析后的配置对象
console.log(read());

