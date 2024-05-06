function simulateGitRemoteV(remotesConfig) { 
    let output = '';  
    for (const remoteName in remotesConfig) {  
        const remoteInfo = remotesConfig[remoteName];  
        const fetchUrl = remoteInfo.url; // 通常用于fetch操作  
        const pushUrl = remoteInfo.pushurl || fetchUrl; // 如果没有指定pushurl，则使用fetchUrl  
        output += `${remoteName}\t${fetchUrl} (fetch)\n`;  
        output += `${remoteName}\t${pushUrl} (push)\n`;  
    }  
    return output;  
}  
  
// 示例对象，包含远程仓库信息  
const remotesConfig = {  
    origin: {  
        url: "http://10.1.236.106/Bfds/fdsf/fds.git",  
        fetch: "+refs/heads/*:refs/remotes/origin/*",  
        pushurl: "http://10.1.236.107/other/repo.git"  
    },  
    second: {  
        url: "http://10.1.236.146/Bfds/fdsf/fds.git",  
        fetch: "+refs/heads/*:refs/remotes/second/*"  
        // 注意：这里没有指定pushurl，所以将使用url作为push操作的URL  
    }  
};  
  
// 调用函数模拟 git remote -v 的输出  
const simulatedOutput = simulateGitRemoteV(remotesConfig);  
console.log(simulatedOutput);