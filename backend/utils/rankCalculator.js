const Complaint = require("../models/complaint");
const Ward = require("../models/ward");

async function calculateRanks() {

  const wards = await Ward.find();

  for (let ward of wards) {

    const complaints = await Complaint.find({
      wardNumber: ward.wardNumber
    });

    let performanceScore = 0;
    let completedCount = 0;

    complaints.forEach(c => {

      if (c.status === "completed") {
        performanceScore += 10;
        completedCount += 1;
      }

      if (c.status === "resolved") {
        performanceScore += 5;
      }

      if (c.status === "pending") {
        performanceScore -= 5;
      }

    });

    await Ward.updateOne(
      { wardNumber: ward.wardNumber },
      {
        performanceScore: performanceScore,
        completedCount: completedCount
      }
    );
  }

  const sorted = await Ward.find().sort({
    performanceScore: -1,
    completedCount: -1
  });

  for (let i = 0; i < sorted.length; i++) {
    await Ward.updateOne(
      { wardNumber: sorted[i].wardNumber },
      { rank: i + 1 }
    );
  }
}

module.exports = calculateRanks;