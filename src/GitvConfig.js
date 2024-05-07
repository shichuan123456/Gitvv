const utils = require("./Utils")
const path = require("path")
const fs = require("fs")

class GitvConfig {
    constructor(opts) {
        this.opts = opts
    }

    // 将 JavaScript 对象转换为 Git 配置文件字符串的方法
    objToGitConfigString(obj) {
        let result = '';
        // 遍历对象的每个部分
        for (const section in obj) {
            result += `[${section}`; // 输出配置的部分，如 "[core]"、"[remote "origin"]"
            // 如果当前部分是 "remote"，则追加远程仓库的名称，如 "origin"
            if (section === 'remote') {
                result += ` "${Object.keys(obj[section])[0]}"`;
            }

            result += `]\n`;

            // 遍历当前部分的键值对
            for (const key in obj[section]) {
                const value = obj[section][key];

                // 如果值是对象，则继续遍历并输出键值对
                if (typeof value === 'object') {
                    for (const subKey in value) {
                        result += `  ${subKey} = ${value[subKey]}\n`;
                    }
                } else {
                    // 否则，直接输出键值对
                    result += `  ${key} = ${value}\n`;
                }
            }

            result += '\n'; // 添加换行，以区分不同部分
        }

        return result.trim(); // 移除末尾可能存在的多余换行
    }

    read() {
        const gitConfigFile = utils.getResourcePath('config');
        const configContent = fs.readFileSync(gitConfigFile, 'utf-8');

        // 存储最终结果的对象
        const config = {};
        let currentSection = null;
        let subSection = null;

        // 将文件按行分割
        const lines = configContent.split('\n');

        // 处理每一行
        lines.forEach((line) => {
            // 去掉前后的空格
            line = line.trim();

            // 跳过空行和注释
            if (!line || line.startsWith(';') || line.startsWith('#')) {
                return;
            }

            // 检查是否是一个新的节(section)
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.slice(1, -1).trim(); // 获取节名称并去除引号
                currentSection = currentSection.replace(/['"]/g, ''); // 移除引号
                subSection = null;

                // 检查节名是否包含空格，处理嵌套节
                if (currentSection.includes(' ')) {
                    let [parentSection, innerSection] = currentSection.split(' ', 2);

                    // 确保父节存在，并去掉引号
                    parentSection = parentSection.replace(/['"]/g, '');
                    innerSection = innerSection.replace(/['"]/g, '');

                    if (!config[parentSection]) {
                        config[parentSection] = {};
                    }

                    // 确保子节存在
                    if (!config[parentSection][innerSection]) {
                        config[parentSection][innerSection] = {};
                    }

                    currentSection = parentSection; // 设置父节
                    subSection = innerSection; // 设置子节
                } else {
                    // 确保单个节存在
                    if (!config[currentSection]) {
                        config[currentSection] = {};
                    }
                }
            } else if (currentSection) {
                // 处理键值对
                const [key, ...valueParts] = line.split('=');
                const keyTrimmed = key.trim();
                const value = valueParts.join('=').trim(); // 合并可能有多个 "=" 的值

                if (subSection) {
                    config[currentSection][subSection][keyTrimmed.replace(/['"]/g, '')] = value; // 添加键值对到子节
                } else {
                    config[currentSection][keyTrimmed.replace(/['"]/g, '')] = value;
                }
            }
        })
        return config;
    }

    // 获取Gitv中的默认配置
    generateDefaultConfig = () => {
        // 定义一个表示 Git 配置的 JavaScript 结构 
        return {
            core: {
                repositoryformatversion: 0,
                filemode: false,
                bare: this.opts.bare ? true : false,
                logallrefupdates: true,
                symlinks: false,
                ignorecase: true
            },
            remote: {
                origin: {
                    url: './remote-a',
                    fetch: '+refs/heads/*:refs/remotes/origin/*'
                },
                "remote-b": {
                    url: './remote-b',
                    fetch: '+refs/heads/*:refs/remotes/origin/*'
                },
            },
            branch: {
                master: {
                    remote: 'origin',
                    merge: 'refs/heads/master'
                }
            }
        };
    }
}

module.exports = GitvConfig;