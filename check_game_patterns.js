const fs = require("fs");
const files = fs.readdirSync(".").filter(f => f.endsWith(".html") && f !== "index.html");

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  console.log("\n==========================================");
  console.log("FILE:", file);

  // Search for balance patterns in the code
  // 1. localStorage keys or getItem/setItem
  const lsMatches = [...content.matchAll(/localStorage\.(getItem|setItem)\(['"]([^'"]+)['"]/g)];
  console.log("LocalStorage Keys:", [...new Set(lsMatches.map(m => m[2]))]);

  // 2. React state initializations with 500 or balance or getItem
  const stateMatches = [...content.matchAll(/useState\(([^)]*balance[^)]*)\)/gi)];
  console.log("useState with balance:", stateMatches.map(m => m[1]));

  // 3. Any occurrence of '500' near balance
  const idx = content.search(/balance/i);
  if (idx !== -1) {
    console.log("Sample balance context:", content.slice(Math.max(0, idx - 50), Math.min(content.length, idx + 100)));
  }
});
