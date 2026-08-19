const fs = require("fs");
const files = fs.readdirSync(".").filter(f => f.endsWith(".html") && f !== "index.html");

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  console.log("\n==========================================");
  console.log("FILE:", file);

  // Check occurrences of balance variable or object keys in code
  if (file.includes("Desert Axe")) {
    // Vanilla JS in script tags
    const match = content.match(/let balance = [^;]+;/);
    console.log("Desert Axe balance var:", match ? match[0] : "Not found");
  } else if (file.includes("Glass Roulette")) {
    const match = content.match(/localStorage\.getItem\(["']roulette_balance["']\)[^;]+/);
    console.log("Glass Roulette match:", match ? match[0] : "Not found");
  } else if (file.includes("Neon Spins")) {
    const match = content.match(/localStorage\.getItem\(["']neon_spins_balance["']\)[^;]+/);
    console.log("Neon Spins match:", match ? match[0] : "Not found");
  } else if (file.includes("Rocet mines")) {
    const match = content.match(/bf=\{balance:500[^}]*\}/);
    console.log("Rocket Mines match:", match ? match[0] : "Not found");
    const matches2 = [...content.matchAll(/balance/gi)];
    matches2.slice(0, 10).forEach(m => {
      console.log("  ", content.slice(Math.max(0, m.index - 30), Math.min(content.length, m.index + 60)));
    });
  } else if (file.includes("avator")) {
    const match = content.match(/balance:500/g);
    console.log("Aviator balance:500 matches count:", match ? match.length : 0);
  } else if (file.includes("chicken road")) {
    const matches = [...content.matchAll(/balance/gi)];
    matches.forEach(m => {
      console.log("  ", content.slice(Math.max(0, m.index - 30), Math.min(content.length, m.index + 60)));
    });
  } else if (file.includes("desert frortune")) {
    const match = content.match(/Wp=\{balance:500[^}]*\}/);
    console.log("Desert Fortune match:", match ? match[0] : "Not found");
  } else if (file.includes("flappy")) {
    const match = content.match(/let playerBalance = [^;]+;/);
    console.log("Flappy match:", match ? match[0] : "Not found");
  } else if (file.includes("lader and snacks")) {
    const matches = [...content.matchAll(/balance/gi)];
    matches.forEach(m => {
      console.log("  ", content.slice(Math.max(0, m.index - 30), Math.min(content.length, m.index + 60)));
    });
  } else if (file.includes("snack and landers 2")) {
    const match = content.match(/balance:500/g);
    console.log("Snakes 2 match count:", match ? match.length : 0);
  } else if (file.includes("tik tak win")) {
    const matches = [...content.matchAll(/balance/gi)];
    matches.forEach(m => {
      console.log("  ", content.slice(Math.max(0, m.index - 30), Math.min(content.length, m.index + 60)));
    });
  }
});
