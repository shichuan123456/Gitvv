const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

/**  
 * 构建Blob数据，包括Blob头和文件内容。  
 * @param {string} fileContent - 文件的内容（字符串形式）。  
 * @returns {Buffer} - 构建的Blob数据（Buffer形式）。  
 */
function buildBlobData(fileContent) {
  // 计算文件内容的字节长度  
  const contentLength = Buffer.byteLength(fileContent, 'utf8');  
  // 创建Blob头，格式为"blob <长度>\x00"  
  const blobHeader = `blob ${contentLength}\x00`;  
  // 将Blob头和文件内容转换为Buffer，并合并为一个Buffer对象  
  return Buffer.concat([Buffer.from(blobHeader), Buffer.from(fileContent)]);  
}

/**  
 * 计算给定数据的SHA-256哈希值。  
 * @param {Buffer} data - 要计算哈希值的数据（Buffer形式）。  
 * @returns {string} - 数据的SHA-256哈希值（十六进制字符串）。  
 */
function calculateHash(data) {
  // 创建一个SHA-256哈希对象  
  const hash = crypto.createHash('sha256');  
  // 更新哈希对象的数据  
  hash.update(data);  
  // 返回哈希值的十六进制字符串  
  return hash.digest('hex');  
}

/**  
 * 异步读取文件，构建Blob数据，并计算其SHA-256哈希值。  
 * @param {string} filePath - 要读取的文件的路径。  
 */
async function readFileAndCalculateHash(filePath) {
  // 验证文件路径  
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided.');
  }

  try {
    // 读取文件内容  
    const fileContent = await fs.readFile(filePath, 'utf8');

    // 构建Blob数据  
    const blobData = buildBlobData(fileContent);

    // 计算SHA-256哈希值  
    const hashValue = calculateHash(blobData);

    // 输出哈希值  
    console.log("Blob 对象的 SHA-256 哈希值为:", hashValue);
  } catch (err) {
    // 捕获并处理错误  
    console.error('读取文件或计算哈希值时发生错误:', err);
  }
}

// 调用函数  
readFileAndCalculateHash(path.join(__dirname, '../example.txt'));