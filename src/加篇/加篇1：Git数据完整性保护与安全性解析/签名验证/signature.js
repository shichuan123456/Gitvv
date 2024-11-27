const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 定义一个异步函数来处理文件读取、签名和验证  
async function signAndVerifyFile(filePath) {
    // 确保filePath已提供  
    if (!filePath) {
        throw new Error('filePath is required');
    }

    // 生成RSA密钥对  
    const {
        publicKey,
        privateKey
    } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    // 读取文件内容  
    try {
        const data = await fs.readFile(filePath, 'utf8');
        // 使用私钥对数据进行签名  
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(data);
        const signature = sign.sign(privateKey, 'hex');

        // 使用公钥验证签名  
        const verify = crypto.createVerify('RSA-SHA256');
        verify.update(data);
        const isVerified = verify.verify(publicKey, signature, 'hex');

        // 输出结果  
        console.log(`Original Data: ${data}`);
        console.log(`Signature: ${signature}`);
        console.log(`Verified: ${isVerified}`);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

// 调用函数并传入文件路径  
signAndVerifyFile(path.join(__dirname, '../example.txt')).catch(err => {
    console.error('Failed to sign and verify file:', err);
});


