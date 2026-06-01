const fs = require("fs");
const md = fs.readFileSync("tasks/_plan.md", "utf8");
fs.writeFileSync("tasks/plan.md", md);
console.log("OK");