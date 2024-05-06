const fs = require("fs")
const readline = require('readline');
const writeFileAsync = require('util').promisify(fs.writeFile);
const utils = require("./Utils")
const path = require("path")
const zlib = require('zlib');
const util = require('util');
const gzip = util.promisify(zlib.gzip);
class GitvIndex {
    constructor() {
        // 获取 Gitv 仓库的根路径
        const gitvRepoPath = utils.getGivWorkingDirRoot();
        // 确定索引文件的路径
        this.indexPath = utils.getRepositoryType() === "bare"
         ? path.join(gitvRepoPath, "index") 
         : path.join(gitvRepoPath, ".gitv", "index") 
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
            console.error("Error reading index file:", err);
            return {}; // 返回空对象或者根据需要进行其他处理
        }
    }


    // 删除文件所有状态的记录
    async deleteAndWrite(filePath) {
        try {
            // 异步读取当前 index 文件的内容
            const idx = await this.read();
            // 遍历该文件的所有 stage，进行清除
            [0, 1, 2, 3].forEach(stage => {
                delete idx[filePath + "," + stage];
            });

            // 异步进行写入
            await this.write(idx);
        } catch (err) {
            console.error("Error deleting and writing index file:", err);
            // 根据实际情况处理错误，例如抛出异常或者返回错误信息
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

            
             // 检查目录是否存在，如果不存在则创建目录
            // await fs.promises.mkdir(path.dirname(this.indexPath), { recursive: true });
            // 异步写入索引文件
            await writeFileAsync(this.indexPath, indexStr);
            console.log("Index file has been successfully written."); // 可选的成功日志
        } catch (err) {
            console.error("Error writing index file:", err); // 错误日志
            throw err; // 抛出异常以便调用者处理
        }
    }

    async updateIndex(filePath) {
        const isOnDisk = fs.existsSync(filePath);
        if (!isOnDisk) return;
        // 获取文件的绝对路径
        // const absolutePath = path.join(utils.getGivWorkingDirRoot(), filePath || "");
        // 实现add的核心写入功能
        // await this. deleteAndWrite(filePath);
        // 写入objects对象和index文件
        await this.writeObjectsAndIndex(filePath, 0, fs.readFileSync(filePath, "utf-8"));
        return "\n";
    }

    async writeObjectsAndIndex(filePath, stage, content) {   // TODO
        var idx = await this.read();
        // console.log(idx, "idx--=-=-=-=");
   
        // const hashContent = 
        // files.write(nodePath.join(files.gitletPath(), "objects", util.hash(str)), str);
        // utils.sha1(str);
        idx[filePath + "," + stage] = await this.writeObjects(utils.createGitBlob(content));
        // idx[filePath + "," + stage] = objects.write(content);
        await this.write(idx);
    }

    async  writeObjects(content) {
        const objectsDir = utils.getRepositoryType() === "bare" 
        ? path.join(utils.getGivWorkingDirRoot(), "objects")
        : path.join(utils.getGivWorkingDirRoot(), ".gitv/objects");

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
    }
}

module.exports = new GitvIndex();

// {
//     'C:\\workspace\\myers\\a.sh,0': '92796ceae2c3120351b66e954f59c4a35711529e'，
//     'C:\\workspace\\myers\\b.sh,0': '92796cfdfdsfdfdsfdsf1324564561231321529e'
// }