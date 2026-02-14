const fs = require("fs");
const Complaint = require("../models/complaint");

async function exportComplaints() {

  const complaints = await Complaint.find({}, "wardNumber status");

  const rows = complaints.map(c =>
    `${c.wardNumber},${c.status}`
  );

  const csv =
    "wardNumber,status\n" +
    rows.join("\n");

  fs.writeFileSync(
    "./pathway/complaints.csv",
    csv
  );

  console.log("Complaints exported for Pathway");
}

module.exports = exportComplaints;
