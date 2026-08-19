const fs = require("fs");
const files = fs.readdirSync(".").filter(f => f.endsWith(".html") && f !== "index.html");

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  console.log("\n==========================================");
  console.log("FILE:", file);

  // Search for key balance variable initialization or usage
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("balance") || line.includes("Balance") || line.includes("500") || line.includes("1000")) {
      // Print short snippet
      const clean = line.replace(/\s+/g, ' ').trim();
      if (clean.length < 300 && (clean.includes("State") || clean.includes("setItem") || clean.includes("getItem") || clean.includes("balance=") || clean.includes("balance:") || clean.includes("setBalance"))) {
        console.log(`Line ${idx+1}: ${clean.slice(0, 150)}`);
      }
    }
  });
});
