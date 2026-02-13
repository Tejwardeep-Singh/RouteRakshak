const calculateRanks = require("./rankCalculator");

async function recalculateRanks() {
  console.log("Recalculating ranks...");
  await calculateRanks();
}

module.exports = recalculateRanks;
