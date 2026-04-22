const fs = require("fs");
const path = require("path");

const ensureJsonFile = (filePath, defaultValue) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
};

const readJsonFile = (filePath, defaultValue) => {
  ensureJsonFile(filePath, defaultValue);
  const raw = fs.readFileSync(filePath, "utf8");
  return raw.trim() ? JSON.parse(raw) : defaultValue;
};

const writeJsonFile = (filePath, value) => {
  ensureJsonFile(filePath, value);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
};

module.exports = {
  ensureJsonFile,
  readJsonFile,
  writeJsonFile,
};
