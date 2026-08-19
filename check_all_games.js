const fs = require("fs");
const files = fs.readdirSync(".").filter(f => f.endsWith(".html") && f !== "index.html");

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  console.log("\n=============================");
  console.log("FILE:", file);
  
  // Find storage keys
  const regex = /localStorage\.(?:getItem|setItem)\(['"]([^'"]+)['"]/g;
  let match;
  const keys = new Set();
  while ((match = regex.exec(content)) !== null) {
    if (match[1].toLowerCase().includes("bal") || match[1].toLowerCase().includes("jem") || match[1].toLowerCase().includes("user") || match[1].toLowerCase().includes("mine") || match[1].toLowerCase().includes("axe")) {
      keys.add(match[1]);
    }
  }
  console.log("Balance-related localStorage keys:", Array.from(keys));

  // Find if it uses DOM element or state for balance
  const domMatches = [...content.matchAll(/id=['"]([^'"]*balance[^'"]*)['"]/gi)];
  console.log("DOM elements with 'balance' in id:", domMatches.map(m => m[1]));
});
