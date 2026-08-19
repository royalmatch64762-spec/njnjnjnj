const fs = require("fs");
const files = fs.readdirSync(".").filter(f => f.endsWith(".html"));

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  console.log("\n==========================================");
  console.log("FILE:", file);

  // Find all id="..." containing balance, coin, or credit
  const idRegex = /id=['"]([^'"]*(?:balance|coin|credit|cash|jem|gem)[^'"]*)['"]/gi;
  let idMatch;
  const ids = new Set();
  while ((idMatch = idRegex.exec(content)) !== null) {
    ids.add(idMatch[1]);
  }
  console.log("IDs found:", Array.from(ids));

  // Find all class="..." containing balance, coin, or credit
  const classRegex = /class=['"]([^'"]*(?:balance|coin|credit|cash)[^'"]*)['"]/gi;
  let classMatch;
  const classes = new Set();
  while ((classMatch = classRegex.exec(content)) !== null) {
    classes.add(classMatch[1]);
  }
  console.log("Classes found:", Array.from(classes));
});
