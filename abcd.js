const fs = require('fs').promises;  
const path = require('path');  
  
async function readAllFilesInDirectory(dirPath) {  
  try {  
    // 读取目录中的所有文件和子目录  
    const files = await fs.readdir(dirPath, { withFileTypes: true });  
    const fileContents = [];  
  
    for (const dirent of files) {  
      const resolvedPath = path.resolve(dirPath, dirent.name);  
  
      if (dirent.isFile()) {  
        // 如果是文件，读取文件内容  
        const content = await fs.readFile(resolvedPath, 'utf8');  
        fileContents.push({ name: dirent.name, content });  
      } else if (dirent.isDirectory()) {  
        // 如果是目录，递归读取该目录下的所有文件  
        const subDirContents = await readAllFilesInDirectory(resolvedPath);  
        fileContents.push(...subDirContents);  
      }  
    }  
  
    return fileContents;  
  } catch (err) {  
    console.error(`无法读取目录 ${dirPath}:`, err);  
    throw err; // 重新抛出错误以便调用者可以处理它  
  }  
}  
  
// 使用示例  
(async () => {  
  try {  
    const directoryPath = path.join(__dirname, '.gitv', 'refs', 'heads'); // 替换为你的目录路径  
    const fileContents = await readAllFilesInDirectory(directoryPath);  
    fileContents.forEach(({ name, content }) => {  
      console.log(`文件: ${name}`);  
      console.log(`内容: ${content}`);  
      console.log('-----');  
    });  
  } catch (err) {  
    console.error('发生错误:', err);  
  }  
})();




