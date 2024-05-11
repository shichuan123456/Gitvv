const fs = require("fs")
const fsPromise = fs.promises;
const path = require("path")
const {
    createHash
} = require("crypto");
class Utils {
    constructor() {}
    // 判断目录是否是一个 Gitv 仓库  
    directoryIsGitvRepo(dir) {
        return this.getRepositoryTypeFromDirectory(dir) !== "";
    }
    // 检查目录下是否存在 Gitv 仓库的必要元数据文件和文件夹
    getRepositoryTypeFromDirectory(dir) {
        if (!fs.existsSync(dir)) return;
        // 检查是否是裸仓库或一般仓库
        const isBareGitvRepository = this.checkRepositoryMetadata(dir, "bare");
        const isGeneralGitvRepository = this.checkRepositoryMetadata(dir, "general");
        // "" , "bare", "general"
        return isBareGitvRepository ? "bare" : (isGeneralGitvRepository ? "general" : "");
    }

    // 获取仓库的类型
    getRepositoryType() {
        const dirRoot = this.getGivWorkingDirRoot()
        return this.getRepositoryTypeFromDirectory(dirRoot)
    }

    // 获取仓库中文件的具体路径
    getResourcePath(fileName = "") {
        return this.getRepositoryType() === "bare" ?
            path.join(this.getGivWorkingDirRoot(), `${fileName}`) :
            path.join(this.getGivWorkingDirRoot(), `.gitv/${fileName}`);
    }

    // 检查 Gitv 仓库的元数据是否存在
    checkRepositoryMetadata(dir, type) {
        // 构建元数据文件和文件夹的路径，HEAD文件、objects文件夹和refs文件夹
        const headFilePath = path.join(dir, type === "bare" ? "HEAD" : ".gitv/HEAD");
        const objectsFolderPath = path.join(dir, type === "bare" ? "objects" : ".gitv/objects");
        const refsFolderPath = path.join(dir, type === "bare" ? "refs" : ".gitv/refs");

        // 检查元数据文件和文件夹是否存在
        return (
            fs.existsSync(headFilePath) &&
            fs.existsSync(objectsFolderPath) &&
            fs.statSync(objectsFolderPath).isDirectory() &&
            fs.statSync(refsFolderPath).isDirectory()
        );
    }

    writeFilesFromTree = (tree, prefix) => {
        Object.keys(tree).forEach((name) => {
            const filePath = path.join(prefix, name); // 拼接文件
            if (typeof (tree[name]) === "string") { // 判断文件还是目录  
                const dir = path.dirname(filePath) // 获取文件的目录 如果不存在。创建目录，然后再写入
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, {
                    recursive: true
                })
                fs.writeFileSync(filePath, tree[name]);
            } else {
                if (!fs.existsSync(filePath)) { // 如果目录是目录的，且不存在，直接创建
                    fs.mkdirSync(filePath, {
                        recursive: true
                    });
                }
                this.writeFilesFromTree(tree[name], filePath); // 递归写入，直到所有遍历完成
            }
        });
    }

    // 命令是否实在Gitv仓库内执行
    isInGitvRepo() {
        return this.getGivWorkingDirRoot() !== "";
    }

    // 获取Gitv仓库的工作区的根目录
    getGivWorkingDirRoot() {
        let dir = process.cwd(); // 当前命令执行目录
        // 从dir开始依次向上查找直到找到或到目录的顶层
        while (!this.directoryIsGitvRepo(dir) && path.parse(dir).root !== path.resolve(dir)) {
            dir = path.join(dir, ".."); // 获取上一级目录
        }
        return this.directoryIsGitvRepo(dir) ? dir : "";
    }

    isSubdirectory(parentPath, childPath) {
        // 统一成绝对路径
        const normalizedChild = path.isAbsolute(childPath) ? childPath : (childPath === '.' ? path.resolve(childPath) : path.join(process.cwd(), childPath))
        const normalizedParent = path.resolve(parentPath);
        return normalizedChild.startsWith(normalizedParent);
    }

    // 加密方法，使用指定算法对内容进行加密
    encrypt = (algorithm, content) => {
        // 创建一个哈希对象，使用指定的算法
        const hash = createHash(algorithm);
        // 更新哈希对象的内容为指定的内容
        hash.update(content);
        // 返回加密后的内容的十六进制表示
        return hash.digest('hex');
    }

    collectFiles = async (pathOrFile) => {
        try {

            const stats = await fs.promises.stat(pathOrFile);
            if (!stats.isDirectory()) {
                // 如果不是目录，直接返回文件路径
                return [pathOrFile];
            }

            // 递归搜集文件
            const files = await fs.promises.readdir(pathOrFile);
            const fileList = await Promise.all(files.map(async (file) => {
                const filePath = path.join(pathOrFile, file);
                const fileStats = await fs.promises.stat(filePath);
                if (fileStats.isDirectory()) {
                    // 如果是目录，递归搜集子目录中的文件
                    return this.collectFiles(filePath);
                } else {
                    // 如果是文件，直接返回文件路径
                    return filePath;
                }
            }));

            // 展平嵌套的数组结构
            return fileList.flat();
        } catch (err) {
            console.error("Error collecting files:", err);
            return [];
        }
    }
    // SHA-1 加密方法，对内容进行 SHA-1 加密
    sha1 = (content) => this.encrypt('sha1', content)

    createGitBlob = (content) => {
        const contentLength = Buffer.byteLength(content, 'utf8');
        const blobHeader = `blob ${contentLength}\x00`;
        const blobString = `${blobHeader}${content}`;
        return blobString;
    }

    createGitObject = (content, type) => {
        const contentLength = Buffer.byteLength(content, 'utf8');
        const blobHeader = `${type} ${contentLength}\x00`;
        const blobString = `${blobHeader}${content}`;
        return blobString;
    }

    async writeToFile(filePath, content) {
        try {
            await fsPromise.writeFile(filePath, content);
            console.log('文件已成功写入:', filePath);
        } catch (error) {
            console.error('写入文件时出现错误:', error);
        }
    }

    convertObject(idx) {
        try {
            // 假设index.read()是一个异步操作，需要等待其完成  
            let convertedObject = {}
            // let idx = await index.read();  
            // 假设inputObject是在index.read()之后可访问的，或者它是一个全局变量  
            for (const [key, value] of Object.entries(idx)) {
                const newKey = key.split(',')[0];
                convertedObject[newKey] = value;
            }
            return convertedObject;
        } catch (error) {
            console.error('An error occurred:', error);
            return {}
        }
    }

    indexTransform(paths) {
        const result = {};
        for (const [key, value] of Object.entries(paths)) {
            const parts = key.split(path.sep); // 使用 path 模块提供的路径分隔符
            let current = result;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (i === parts.length - 1) {
                    current[part] = value;
                } else {
                    current[part] = current[part] || {};
                    current = current[part];
                }
            }
        }
        return result;
    }

    async checkFileExistence(filePath) {
        try {
            await fsPromise.access(filePath);
            return true; // 文件存在且可访问  
        } catch (err) {
            if (err.code === 'ENOENT') {
                return false; // 文件不存在  
            } else {
                throw err; // 其他类型的错误，重新抛出  
            }
        }
    }

    async readFileIfExistsAsync(filePath) {
        try {
            // 检查文件是否存在  
            const exists = await checkFileExistence(filePath);
            if (exists) {
                // 文件存在，读取文件内容  
                const content = await fs.readFile(filePath, 'utf8');
                console.log(`文件内容:\n${content}`);
                return content;
            } else {
                // 文件不存在  
                console.log(`${filePath} 不存在`);
                return false;
            }
        } catch (err) {
            // 处理读取文件时可能发生的其他错误  
            console.error(`读取文件时出错: ${err.message}`);
        }
    }

    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`文件 ${filePath} 已被删除`);
        } catch (error) {
            console.error(`删除文件 ${filePath} 时出错:`, error);
        }
    }

    async readAllFilesInDirectory(dirPath, cb) {
        try {
            // 读取目录中的所有文件和子目录  
            
            const files = await fsPromise.readdir(dirPath, {
                withFileTypes: true
            });

            for (const dirent of files) {
                const resolvedPath = path.resolve(dirPath, dirent.name);

                if (dirent.isFile()) {
                    // 如果是文件，读取文件内容  
                    const content = await fsPromise.readFile(resolvedPath, 'utf8');
                    // 调用传入的回调函数处理文件内容  
                    await cb(dirent.name, content, resolvedPath);
                } else if (dirent.isDirectory()) {
                    // 如果是目录，递归读取该目录下的所有文件  
                    await this.readAllFilesInDirectory(resolvedPath, cb);
                }
            }
        } catch (err) {
            console.error(`无法读取目录 ${dirPath}:`, err);
            throw err; // 重新抛出错误以便调用者可以处理它  
        }
    }
}


module.exports = new Utils()