const fs = require("fs")
const readline = require('readline');
const writeFileAsync = require('util').promisify(fs.writeFile);
const config = require("./GitvConfig")
const utils = require("./Utils")
const path = require("path")
class GitvIndex {
    constructor() {
        const gitvRepoPath = utils.getGivWorkingDirRoot();
        this.indexPath = config.getConfigObj()["core"]["bare"]
         ? path.join(gitvRepoPath, ".gitv", "index") 
         : path.join(gitvRepoPath, "index")
    }
    // 读取 index 文件，返回一个包含 index 对象的 Promise
    async read() {
        try {
            const idx = {};
            // 创建文件读取流
            const fileStream = fs.createReadStream(this.indexPath);
            const rl = readline.createInterface({
                input: fileStream,
            });

            for await (const line of rl) {
                const lineArray = line.split(/ /);
                idx[index.key(lineArray[0], lineArray[1])] = lineArray[2];
            }

            return idx;
        } catch (err) {
            console.error("Error reading index file:", err);
            return {}; // 返回空对象或者根据需要进行其他处理
        }
    }

    async deleteAndWrite(filePath) {
        try {
            // 异步读取当前 index 文件的内容
            const idx = await index.read();
            // 遍历该文件的所有 stage，进行清除
            [0, 1, 2, 3].forEach(stage => {
                delete idx[index.key(filePath, stage)];
            });

            // 异步进行写入
            await index.write(idx);
        } catch (err) {
            console.error("Error deleting and writing index file:", err);
            // 根据实际情况处理错误，例如抛出异常或者返回错误信息
            throw err;
        }
    }

    async write(index) {
        try {
            // 构造索引字符串
            const indexStr = Object.entries(index)
                .map(([key, value]) => `${key.split(",")[0]} ${key.split(",")[1]} ${value}`)
                .join("\n") + "\n";

            // 异步写入索引文件
            await writeFileAsync(this.indexPath, indexStr);
            console.log("Index file has been successfully written."); // 可选的成功日志
        } catch (err) {
            console.error("Error writing index file:", err); // 错误日志
            throw err; // 抛出异常以便调用者处理
        }
    }

    updateIndex(filePath) {
        const isOnDisk = fs.existsSync(filePath);
        if (!isOnDisk) return;
        // 对空的文件夹不进行处理
        if (fs.statSync(filePath).isDirectory()) throw new Error(" is a directory - you should add files inside\n");
        // 获取文件的绝对路径
        const absolutePath = path.join(utils.getGitvPath(), filePath || "");
        // 实现add的核心写入功能
        this.index.writeRm(pathFile);
        // 写入objects对象和index文件
        this.index.writeObjectsAndIndex(pathFile, 0, fs.readFileSync(absolutePath, "utf-8"));
        return "\n";
    }
}

module.exports = GitvIndex;