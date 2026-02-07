require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../connection/mongoose");
const Ward = require("../models/ward");

const wards = [
  { ward_id: 1, ward_name: "Ward 1" },
  { ward_id: 2, ward_name: "Ward 2" },
  { ward_id: 3, ward_name: "Ward 3" }
  // add up to 90 later
];

const seedWards = async () => {
  try {
    await connectDB();
    await Ward.deleteMany(); // clean slate (safe now)
    await Ward.insertMany(wards);

    console.log("Wards seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedWards();
