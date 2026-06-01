const fs = require("fs");
process.stdin.on("data", c => fs.appendFileSync("tasks/plan.md", c));
process.stdin.on("end", () => console.log("OK"));