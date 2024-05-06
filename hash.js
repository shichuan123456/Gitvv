const { createHash } = require("crypto");

encrypt = (algorithm, content) => {
    const hash = createHash(algorithm)
    hash.update(content)
    return hash.digest('hex')
}

sha1 = (content) => encrypt('sha1', content)

console.log(sha1("blob 6\x00hello\n"));