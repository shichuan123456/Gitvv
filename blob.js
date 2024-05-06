function createGitBlob(content) {
    const contentLength = Buffer.byteLength(content + "\n", 'utf8');
    const blobHeader = `blob ${contentLength}\x00`;
    const blobString = `${blobHeader}${content}`;
    return blobString;
}

// 示例用法
const content = 'albl';
const blobString = createGitBlob(content);
console.log(blobString);
