class Commit {
    constructor(id, message, parents = []) {
      this.id = id;
      this.message = message;
      this.parents = parents; // 父提交
    }
  }
  
  class GitLog {
    constructor() {
      this.commits = [];
    }
  
    addCommit(commit) {
      this.commits.push(commit);
    }
  
    draw() {
      // 排序确保提交顺序
      this.commits.sort((a, b) => b.id - a.id);
  
      const output = [];
      const branchStack = [];
  
      // 遍历每个提交
      this.commits.forEach((commit) => {
        const parentCount = commit.parents.length;
  
        // 检查分支和合并
        if (parentCount > 1) {
          // 如果有两个父提交，处理合并
          const mergeLine = `${' '.repeat(branchStack.length * 2)}|\\`;
          output.push(mergeLine);
          branchStack.push(mergeLine);
        }
  
        // 添加提交信息
        const line = `${' '.repeat(branchStack.length * 2)}* ${commit.id} ${commit.message}`;
        output.push(line);
  
        // 如果提交有一个父提交，表示直线分支
        if (parentCount === 1) {
          branchStack.push(`|`);
        } else if (parentCount === 0 && branchStack.length > 0) {
          // 如果是最早的提交，减少堆栈深度
          branchStack.pop();
        }
      });
  
      // 反转输出，以确保顺序正确
      return output.reverse().join('\n');
    }
  }
  
  // 示例 Git 日志
  const gitLog = new GitLog();
  gitLog.addCommit(new Commit(3, 'b.js', [1]));
  gitLog.addCommit(new Commit(2, 'dev add src/dev.js', [1]));
  gitLog.addCommit(new Commit(1, 'add src/a.js'));
  gitLog.addCommit(new Commit(4, "Merge branch 'dev'", [2, 3]));

  // 输出 Git 图
  console.log(gitLog.draw());
  