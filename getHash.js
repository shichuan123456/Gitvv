const fs = require('fs').promises;

async function getBranchHash(branch = 'HEAD') {
    let refPath = `.gitv/${branch}`;
    let headContent;

    try {
        // 尝试读取HEAD的内容
        headContent = await fs.readFile(refPath, 'utf8');
        headContent = headContent.trim();

        // 检查HEAD是否直接是一个合法的hash值
        if (/^[0-9a-f]{40}$/.test(headContent)) {
            return headContent;
        }
        
        // 如果HEAD是一个符号引用（以'ref: '开头），解析出实际的分支引用路径并读取
        if (headContent.startsWith('ref: ')) {
            refPath = `.gitv/${headContent.substring(5)}`; // 移除'ref: '前缀
            headContent = await fs.readFile(refPath, 'utf8');
            return headContent.trim();
        } else {
            throw new Error('Unexpected format in .git/HEAD');
        }
    } catch (error) {
        console.log('=====>errror',error)
        if (error.code === 'ENOENT') {
            throw new Error('Git repository not found or invalid branch provided');
        } else {
            throw error;
        }
    }
}

// 使用方法
getBranchHash()
    .then(hash => {
        console.log(`The hash for the current branch is: ${hash}`);
    })
    .catch(error => {
        console.error(error.message);
    });