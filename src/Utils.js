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
        const isBareGitvRepository = this.isExistGitvRepoMetadata(dir, "bare");
        const isGeneralGitvRepository = this.isExistGitvRepoMetadata(dir, "general");
        // "" , "bare", "general"
        return isBareGitvRepository ? "bare" : (isGeneralGitvRepository ? "general" : "");
    }

    // 检查 Gitv 仓库的元数据是否存在
    isExistGitvRepoMetadata(dir, type) {
        // 构建元数据文件和文件夹的路径  
        const baseDir = type === "bare" ? dir : path.join(dir, '.gitv');
        const headFilePath = path.join(baseDir, 'HEAD');
        const objectsFolderPath = path.join(baseDir, 'objects');
        const refsFolderPath = path.join(baseDir, 'refs');

        // 检查元数据文件和文件夹是否存在  
        try {
            return (
                fs.existsSync(headFilePath) &&
                fs.statSync(objectsFolderPath).isDirectory() &&
                fs.statSync(refsFolderPath).isDirectory()
            );
        } catch (error) {
            // 如果发生错误（例如目录不存在），则返回false  
            return false;
        }
    }

    // 获取仓库的类型
    getRepositoryType() {
        //获取工作区根目录
        const dirRoot = this.getGivWorkingDirRoot()
        // 指定目录的仓库类型获取，封装init命令时已经实现
        return this.getGitvRepoType(dirRoot)
    }

    // 获取仓库中文件的具体路径
    getResourcePath(fileName = "") {
        return this.getRepositoryType() === "bare" ?
            path.join(this.getGivWorkingDirRoot(), `${fileName}`) :
            path.join(this.getGivWorkingDirRoot(), `.gitv/${fileName}`);
    }

    

    async writeFilesFromTree(tree, prefix) {
        try {
            // 遍历树的每一个节点  
            for (const name of Object.keys(tree)) {
                const filePath = path.join(prefix, name);

                if (typeof tree[name] === 'string') {
                    // 如果是文件，则直接写入文件（fsPromise.writeFile如果文件所在的目录不存在，它会自动创建这些目录）  
                    await fsPromise.writeFile(filePath, tree[name]);
                } else {
                    try {
                        await fsPromise.mkdir(filePath, {
                            recursive: true
                        });
                    } catch (err) {
                        if (err.code !== 'EEXIST') {
                            throw err;
                        }
                    }
                    // 如果是目录，则递归调用自身  
                    await this.writeFilesFromTree(tree[name], filePath);
                }
            }
        } catch (err) {
            throw err;
        }
    }

    // 命令是否在Gitv仓库内执行
    isInGitvRepo() {
        return this.getGivWorkingDirRoot() !== "";
    }

    // 如果目录目标已经是绝对路径，则直接返回；否则，将其与当前工作目录拼接后返回  
    resolveAbsolutePath(directoryTarget = "") {
        if (path.isAbsolute(directoryTarget)) {
            // 如果是绝对路径，则直接返回  
            return directoryTarget;
        } else {
            // 如果不是绝对路径，则与当前工作目录拼接  
            // process.cwd()是当前执行命令的时候文件夹所在的路径
            return path.join(process.cwd(), directoryTarget);
        }
    }

    // 获取Gitv仓库的工作区的根目录
    getGivWorkingDirRoot() {
        let dir = process.cwd(); // 当前命令执行目录
        // 从dir开始依次向上查找直到找到或到目录的顶层
        while (!this.isCurrentDirectoryGitvRepo(dir) && path.parse(dir).root !== path.resolve(dir)) {
            dir = path.join(dir, ".."); // 获取上一级目录
        }
        return this.isCurrentDirectoryGitvRepo(dir) ? dir : "";
    }

    isSubdirectory(parentPath, childPath) {
        return childPath.startsWith(path.resolve(parentPath));
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

    // SHA-1 加密方法，调用encrypt对内容进行 SHA-1 加密
    sha1 = (content) => encrypt('sha1', content)
    collectFiles = async (pathOrFile) => {
        try {
            const stats = await fsPromise.stat(pathOrFile);
            if (!stats.isDirectory()) {
                // 如果不是目录，直接返回文件路径
                return [pathOrFile];
            }

            // 递归搜集文件
            const files = await fsPromise.readdir(pathOrFile);
            const fileList = await Promise.all(files.map(async (file) => {
                const filePath = path.join(pathOrFile, file);
                const fileStats = await fsPromise.stat(filePath);
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
            throw err;
        }
    }

    createGitBlob = (content) => {
        const contentLength = Buffer.byteLength(content, 'utf8');
        const blobHeader = `blob ${contentLength}\x00`;
        const blobString = `${blobHeader}${content}`;
        return blobString;
    }

    createGitObject = (content, type) => {
        // 获取content的字节长度  
        const contentLength = Buffer.byteLength(content, 'utf8');
        // 构建对象头，格式为 "类型 长度\x00"  
        const header = `${type} ${contentLength}\x00`;
        // 拼接对象头和实际内容，形成完整的Git对象内容  
        return `${header}${content}`;
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
            let convertedObject = {}
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
            throw err;
        }
    }

    async readObject(hash = "") {
        let content
        try {
            const filePath = path.join(this.getResourcePath(), 'objects', hash.slice(0, 2), '/', hash.slice(2))
            content = fs.readFileSync(filePath, 'utf8').trim()
            return content;
        } catch (error) {
            return undefined
        }
    }

    readLines(str) {
        return str.split("\n").filter(function (l) {
            return l !== "";
        });
    }

    async fileTree(treeHash, tree) {
        try {
            if (tree === undefined) {
                return this.fileTree(treeHash, {});
            }
            const treeHashContent = path.join(this.getResourcePath('objects'), treeHash.slice(0, 2), '/', treeHash.slice(2));

            this.readLines(treeHashContent).forEach(async line => {
                var lineTokens = line.split(/ /);
                tree[lineTokens[2]] = lineTokens[0] === "tree" ?
                    await this.fileTree(lineTokens[1], {}) :
                    lineTokens[1];
            });
            return tree;
        } catch (err) {
            throw err;
        }
    }

    flattenNestedTree(tree, obj, prefix) {
        if (obj === undefined) {
            return this.flattenNestedTree(tree, {}, "");
        }
        Object.keys(tree).forEach(dir => {
            var filePath = path.join(prefix, dir);
            if (typeof tree[dir] === "string") {
                obj[filePath] = tree[dir];
            } else {
                this.flattenNestedTree(tree[dir], obj, filePath);
            }
        });
        return obj;
    }

    setIn(obj, arr) {
        if (arr.length === 2) {
            obj[arr[0]] = arr[1];
        } else if (arr.length > 2) {
            obj[arr[0]] = obj[arr[0]] || {};
            util.setIn(obj[arr[0]], arr.slice(1));
        }
        return obj;
    }

    addDesc(heading, lines) {
        return lines.length > 0 ? [heading, lines] : [];
    }

    formattedDate(dateString) {
        const date = new Date(dateString);

        const options = {
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            year: 'numeric',
            timeZoneName: 'short'
        };
        return date.toLocaleString('en-US', options);
    }
}


module.exports = new Utils()