const fs = require('fs');
const path = require('path');

// 递归读取文件内容
function readRefFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    console.log('Reading file:', filePath);
    console.log('Content:', content);

    // 如果内容为hash值，则直接返回
    if (content.match(/^[0-9a-f]{40}$/)) {
        console.log('Hash value found:', content);
        return content;
    }

    const contentList = content.split('ref: ')
    const p=contentList[contentList.length-1]
    // 如果内容为引用，则继续读取引用对应的文件内容
    const refPath = path.join('.gitv/', p);
    return readRefFile(refPath);
}

// 读取HEAD文件内容
const headFilePath = path.join('.gitv/', 'HEAD');
const result = readRefFile(headFilePath);
console.log('Final result:', result);