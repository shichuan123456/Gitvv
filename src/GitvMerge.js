const GitvRef = require("./GitvRef")
const utils = require("./Utils")
const path = require("path")

class GitvMerge {
    constructor(branch) {
        this.branch = branch;
        this.refs = new GitvRef();
        const gitvRepoPath = utils.getResourcePath();
        // 本地分支目录的路径
        this.localBranchesDir = path.join(gitvRepoPath, 'refs', 'heads');
    }
    merge() {
        try {
            console.log('merge', this.branch);
            // 必须是Gitv仓库
            if (!utils.isInGitvRepo()) throw new Error("not a Gitv repository");
            // 不能是裸仓库
            if (utils.getRepositoryType() === "bare") throw new Error("this operation must be run in a Gitv work tree");
            // 当前分支
            var receiverHash = this.refs.getBranchHash(GitvRef.headFilePath);
            // 要合并的分支
            var giverHash = this.refs.getBranchHash(path.join(this.localBranchesDir, this.branch));
            if (this.refs.isHeadDetached()) {
                throw new Error("unsupported")
            } else if (giverHash === undefined) {
                throw new Error(this.branch + ": expected commit type");
            } else if (receiverHash !== undefined &&
                (receiverHash === giverHash || objects.isAncestor(receiverHash, giverHash))) {
                return "Already up-to-date";
            } else {
                var paths = diff.changedFilesCommitWouldOverwrite(giverHash);
                if (paths.length > 0) {
                    throw new Error("local changes would be lost\n" + paths.join("\n") + "\n");
                } else if (merge.canFastForward(receiverHash, giverHash)) {
                    merge.writeFastForwardMerge(receiverHash, giverHash);
                    return "Fast-forward";
                } else {
                    merge.writeNonFastForwardMerge(receiverHash, giverHash, ref);
                    if (merge.hasConflicts(receiverHash, giverHash)) {
                        return "Automatic merge failed. Fix conflicts and commit the result.";
                    } else {
                        return gitlet.commit();
                    }
                }
            }
        } catch (err) {
            throw err;
        }
    }

    writeNonFastForwardMerge(receiverHash, giverHash, giverRef) {
        refs.write("MERGE_HEAD", giverHash);
        merge.writeMergeMsg(receiverHash, giverHash, giverRef);
        merge.writeIndex(receiverHash, giverHash);

        if (!config.isBare()) {
            workingCopy.write(merge.mergeDiff(receiverHash, giverHash));
        }
    }

    mergeDiff(receiverHash, giverHash) {
        return diff.tocDiff(objects.commitToc(receiverHash),
                            objects.commitToc(giverHash),
                            objects.commitToc(merge.commonAncestor(receiverHash, giverHash)));
    }

    hasConflicts(receiverHash, giverHash) {
        var mergeDiff = merge.mergeDiff(receiverHash, giverHash);
        return Object.keys(mergeDiff)
            .filter(function (p) {
                return mergeDiff[p].status === diff.FILE_STATUS.CONFLICT
            }).length > 0
    }

    writeMergeMsg(receiverHash, giverHash, ref) {
        var msg = "Merge " + ref + " into " + refs.headBranchName();
        var mergeDiff = merge.mergeDiff(receiverHash, giverHash);
        var conflicts = Object.keys(mergeDiff)
            .filter(function(p) { return mergeDiff[p].status === diff.FILE_STATUS.CONFLICT });
        if (conflicts.length > 0) {
          msg += "\nConflicts:\n" + conflicts.join("\n");
        }
        files.write(files.gitletPath("MERGE_MSG"), msg);
      }
}


module.exports = GitvMerge;