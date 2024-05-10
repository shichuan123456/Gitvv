const commits = [
  {
      hash: '1583b146d4e3909acd52f53a17f89cc56df78326',
      refs: ['HEAD', 'dpmanager', 'origin/dpmanager'],
      message: '[feat]:[自优化][嵌入用户管理views]',
      author: 'admin <admin@qq.com>',
      date: 'Wed May 8 15:44:34 2024 +0800',
      parents: ['6ad5536c97c80ca9f4de4a1d2df862b89b33d9eb']
  },
  {
      hash: '6ad5536c97c80ca9f4de4a1d2df862b89b33d9eb',
      refs: [],
      message: '[feat]:[自优化][merge master code]',
      author: 'admin <admin@qq.com>',
      date: 'Mon May 6 15:21:43 2024 +0800',
      parents: ['1bf643be', 'c2ea9578']
  },
  {
      hash: 'c2ea9578c04edbc3c100e238df4ace535c7b8319',
      refs: ['origin/master', 'origin/HEAD'],
      message: 'Merge branch \'master_safe\' into \'master\'\n\n[feat]:[自优化][安全加固，添加用户密码禁止复制粘贴及添加输入规则校验]\n\nSee merge request BDP_DP/ambari-release-AMBARI-2.7.3.0-139!206',
      author: 'zhangzy26 <zhangzy26@asiainfo.com>',
      date: 'Mon May 6 15:15:54 2024 +0800',
      parents: ['ae12db79', '579ea4e5']
  },
  {
      hash: '579ea4e53f2b98d0182c1776ea423058e26be3ea',
      refs: ['origin/master_safe', 'master_safe'],
      message: '[feat]:[自优化][安全加固，添加用户密码禁止复制粘贴及添加输入规则校验]',
      author: 'admin <admin@qq.com>',
      date: 'Mon May 6 15:12:07 2024 +0800',
      parents: []
  }
];

function drawGraph(commits, depth = 0) {
  commits.forEach(commit => {
      console.log('| '.repeat(depth) + '* commit ' + commit.hash + ' (' + commit.refs.join(', ') + ')');
      console.log('| '.repeat(depth + 1) + 'Author: ' + commit.author);
      console.log('| '.repeat(depth + 1) + 'Date:   ' + commit.date);
      console.log('| '.repeat(depth + 1) + '\n');
      commit.message.split('\n').forEach(line => {
          console.log('| '.repeat(depth + 1) + '    ' + line);
      });

      if (commit.parents.length > 1) {
          console.log('| '.repeat(depth + 1) + '|\\  Merge: ' + commit.parents.join(' '));
      } else if (commit.parents.length === 1) {
          console.log('| '.repeat(depth + 1) + '|\\');
          console.log('| '.repeat(depth + 1) + '| * commit ' + commit.parents[0]);
      }

      console.log('');
      if (commit.parents.length > 0) {
          drawGraph(commits.filter(c => commit.parents.includes(c.hash)), depth + 1);
      }
  });
}

drawGraph(commits);