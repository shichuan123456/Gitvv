const fs = require("fs")
const readline = require('readline');
const util = require('util');
const writeFileAsync = util.promisify(fs.writeFile);
const utils = require("./Utils")
const path = require("path")
const zlib = require('zlib');
const gzip = util.promisify(zlib.gzip);
class GitvIndex {
    constructor() {
        this.indexPath = utils.getResourcePath('index');
    }
    // 读取 index 文件，返回一个包含 index 对象的 Promise
    async read() {
        try {
            // 存储索引文件内容的对象
            const idx = {};
            // 创建文件读取流
            const fileStream = fs.createReadStream(this.indexPath);
            const rl = readline.createInterface({
                input: fileStream,
            });

            // 逐行读取索引文件内容
            for await (const line of rl) {
                if (!line) continue; // 跳过当前循环，不进行处理
                const lineArray = line.split(/ /);
                // 文件名和状态作为key唯一标识blob
                idx[lineArray[0] + "," + lineArray[1]] = lineArray[2];
            }
            return idx;
        } catch (err) {
            throw err;
        }
    }


    // 删除文件所有状态的记录
    async deleteAndWrite(filePath) {
        try {
            // 异步读取当前 index 文件的内容
            const idx = await this.read();
            // 遍历该文件的所有 stage，进行清除, stage number和合并的冲突有关我们后续会做深入的讲解
            [0, 1, 2, 3].forEach(stage => {
                delete idx[filePath + "," + stage];
            });
            // 异步进行写入，上面已经封装
            await this.write(idx);
        } catch (err) {
            throw err;
        }
    }

    // 写入整个index对象
    async write(index) {
        try {
            // 构造索引字符串
            const indexStr = Object.entries(index)
                .map(([key, value]) => `${key.split(",")[0]} ${key.split(",")[1]} ${value}`)
                .join("\n") + "\n";

            // 异步写入索引文件
            await writeFileAsync(this.indexPath, indexStr);
        } catch (err) {
            throw err;
        }
    }

    async updateIndex(filePath) {
        try {
            const isOnDisk = fs.existsSync(filePath);
            if (!isOnDisk) return;
            await this.writeObjectsAndIndex(filePath, 0, fs.readFileSync(filePath, "utf-8"));
            return "\n";
        } catch (err) {
            throw err;
        }
    }

    async writeObjectsAndIndex(filePath, stage, content) {
        try {
            var idx = await this.read();
            // 我们会先通过`writeObjects`将文件内容写入objects，然后返回文件的hash，再更新index文件
            idx[filePath + "," + stage] = await this.writeObjects(utils.createGitBlob(content));
            await this.write(idx);
        } catch (err) {
            throw err;
        }
    }

    async filteredFiles(files) {
        try {
            const idx = utils.convertObject(await this.read());
            return files.filter(file => idx.hasOwnProperty(path.relative(utils.getGivWorkingDirRoot(), file.toString())));
        } catch (err) {
            throw err;
        }
    }

    async writeObjects(content) {
        try {
            const objectsDir = utils.getResourcePath('objects');
            const blob = utils.sha1(content)
            // 提取文件夹名称
            const folderName = blob.substring(0, 2)
            // 构建文件夹路径
            const folderPath = path.join(objectsDir, folderName)

            try {
                // 检查文件夹是否存在
                await fs.promises.access(folderPath)
            } catch (err) {
                // 如果文件夹不存在，则创建文件夹
                await fs.promises.mkdir(folderPath)
            }

            // 构建文件路径
            const filePath = path.join(folderPath, blob.substring(2))

            // 写入文件内容
            // await writeFileAsync(filePath, await gzip(content))
            await writeFileAsync(filePath, content)
            return blob
        } catch (err) {
            throw err
        }
    }
}

module.exports = new GitvIndex();