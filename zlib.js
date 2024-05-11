const zlib = require('zlib');
const util = require('util');
const fs = require('fs');
const path = require('path');

const filename = path.join(__dirname,'.gitv','objects','3d','63ded2caa4f4d898c6ced1dd602260b9755a3d');
console.log('filename===>',filename)
const dataToCompress = 'Hello, world!';
const gzip = util.promisify(zlib.gzip);
const writeFile = util.promisify(fs.writeFile);


// async function compressAndWriteToFile(filename, dataToCompress) {
//     try {
//         const compressedData = await gzip(dataToCompress);
//         await writeFile(filename, compressedData);
//         console.log(`Data compressed and written to ${filename}`);
//     } catch (err) {
//         console.error(err);
//     }
// }

// compressAndWriteToFile(filename, dataToCompress);
// zlib.gzip(dataToCompress, (err, compressedData) => {
//     if (err) {
//         console.error(err);
//         return;
//     }

//     fs.writeFile(filename, compressedData, (err) => {
//         if (err) {
//             console.error(err);
//             return;
//         }
//         console.log(`Data compressed and written to ${filename}`);
//     });
// });

fs.readFile(filename, (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    zlib.unzip(data, (err, decompressedData) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(decompressedData.toString('utf8')); // 假设解压后的数据是 UTF-8 编码的文本
    });
});



















// // 原始文件内容
// const fileContent = 'This is some content to be compressed.';

// // 使用 zlib 模块的 deflate 方法对文件内容进行压缩
// zlib.deflate(Buffer.from(fileContent, 'utf8'), (err, compressedData) => {
//     if (err) {
//         console.error('Error compressing data:', err);
//     } else {
//         // 打印压缩后的二进制数据
//         console.log('Compressed data:', compressedData);

//         // 使用 zlib 模块的 inflate 方法对压缩后的数据进行解压缩
//         zlib.inflate(compressedData, (err, decompressedData) => {
//             if (err) {
//                 console.error('Error decompressing data:', err);
//             } else {
//                 // 打印解压缩后的原始文件内容
//                 console.log('Decompressed data:', decompressedData.toString('utf8'));
//             }
//         });
//     }
// });




// 要读取的压缩文件路径
// const compressedFilePath = 'C:\\workspace\\myers\\.gitv\\objects\\00effb296931addc0dec5352f7a94b67ce7c92a9';
// const fs = require("fs");
// // 使用 fs 模块读取压缩文件内容
// fs.readFile(compressedFilePath, (err, compressedData) => {
//     if (err) {
//         console.error('Error reading compressed file:', err);
//     } else {
//         // 使用 zlib 模块的 gunzip 方法对压缩数据进行解压缩
//         console.log(compressedData);
//         zlib.inflateRaw(Buffer.from(compressedData, 'hex'), (err, uncompressedData) => {
//             if (err) {
//                 console.error('Error decompressing data:', err);
//             } else {
//                 // 打印解压缩后的原始文件内容
//                 console.log('Decompressed data:', uncompressedData.toString('utf8'));
//             }
//         });
//     }
// });

// import zlib
// contents = open("effb296931addc0dec5352f7a94b67ce7c92a9", "rb").read()
// zlib.decompress(contents)