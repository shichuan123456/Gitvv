const utils = require("./Utils")
const index = require("./GitvIndex")
// const refs = require("./GitvRefs")
const fs = require('fs').promises;
const path = require('path');

class GitvStatus {
    constructor() {
        console.log(123);
    }

    async status() {
        console.log("gitv commit -m \"123456\"");
    }
}

module.exports = GitvStatus;