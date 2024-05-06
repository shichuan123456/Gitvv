const path = require('path');
function indexTransform(paths) {
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

// 示例路径对象
const paths = {
    'src\\bcd.js': '17c43',
    'src\\lib\\a\\a.js': '61',
    'src\\lib\\b\\b.js': 'bfe'
};

// 转换路径对象为 src 对象
const src = indexTransform(paths);

// 输出转换后的 src 对象
console.log(JSON.stringify(src, null, 2));
