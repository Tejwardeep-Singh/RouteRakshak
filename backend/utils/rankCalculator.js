const Complaint = require("../models/complaint");
const Ward = require("../models/ward");

async function calculateRanks() {

  const wards = await Ward.find();

  for (let ward of wards) {

    const complaints = await Complaint.find({
      wardNumber: ward.wardNumber
    });

    let score = 0;
    let completedCount = 0;

    complaints.forEach(c => {
      if (c.status === "pending") score += 3;
      if (c.status === "resolved") score += 1;
      if (c.status === "completed") completedCount += 1;
    });

    await Ward.updateOne(
      { wardNumber: ward.wardNumber },
      {
        score: score,
        completedCount: completedCount
      }
    );
  }


  const sorted = await Ward.find().sort({
    score: 1,
    completedCount: -1
  });

  for (let i = 0; i < sorted.length; i++) {
    await Ward.updateOne(
      { wardNumber: sorted[i].wardNumber },
      { rank: i + 1 }
    );
  }

  console.log("Smart ranks updated.");
}

module.exports = calculateRanks;
