const fs = require('fs');
const path = require('path');

const inventoriesPath = path.resolve(__dirname, 'inventories.json');
const coinsPath = path.resolve(__dirname, 'coins.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}');
  }
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Inventories
function getInventories() {
  return readJSON(inventoriesPath);
}

function saveInventories(data) {
  writeJSON(inventoriesPath, data);
}

// Coins
function getCoins() {
  return readJSON(coinsPath);
}

function saveCoins(data) {
  writeJSON(coinsPath, data);
}

module.exports = {
  getInventories,
  saveInventories,
  getCoins,
  saveCoins,
};
