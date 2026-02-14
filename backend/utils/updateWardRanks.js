const fs = require("fs");
const Ward = require("../models/ward");

async function updateWardRanks() {

  const data = fs.readFileSync(
    "./pathway/ward_ranking.csv",
    "utf-8"
  );

  const lines = data.split("\n").slice(1);

  for (let line of lines) {

    if (!line) continue;

    const [wardNumber, total_score, completed_count, rank] = line.split(",");

    await Ward.updateOne(
      { wardNumber: parseInt(wardNumber) },
      {
        score: parseInt(total_score),
        completedCount: parseInt(completed_count),
        rank: parseInt(rank)
      }
    );
  }

  console.log("Mongo updated with Pathway ranks");
}

module.exports = updateWardRanks;
