import * as fs from "fs";

// Replace
let dirs = fs.readdirSync("../build/behavior_packs/gen/scripts/src");

function insert(str, index, value) {
  return str.substr(0, index) + value + str.substr(index);
}

dirs.forEach((f) => {
  try {
    let content = fs.readFileSync("../build/behavior_packs/gen/scripts/src/" + f);
    let c = content
      .toString()
      .split("\n")
      .filter((val) => !val.endsWith('"@minecraft/server";'))
      .map((v) =>
        v.startsWith("import") && v.endsWith('";') && !v.endsWith('.js";') ? insert(v, v.length - 2, ".js") : v
      );
    c.unshift(`class BlockLocation {
        constructor(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
        }
      }`);
    c = c.join("\n");
    fs.writeFileSync(f, c);
    console.log("writring: ", f, { flag: "a+" });
  } catch (e) {
    console.log(e);
  }
});