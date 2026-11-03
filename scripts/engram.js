const { spawnSync } = require("child_process");
const path = require("path");

const dataDir = path.resolve(__dirname, "..", ".engram", "data");
const exe =
  process.platform === "win32"
    ? path.join(__dirname, "..", "bin", "engram.exe")
    : path.join(__dirname, "..", "bin", "engram");

const result = spawnSync(exe, process.argv.slice(2), {
  stdio: "inherit",
  env: {
    ...process.env,
    ENGRAM_DATA_DIR: dataDir,
    ENGRAM_NO_UPDATE_CHECK: "1",
  },
});
process.exit(result.status ?? 1);
