require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Ward = require("../models/ward");
const connectDB = require("../connection/mongoose");

async function importWards() {
  await connectDB();

  const filePath = path.join(__dirname, "../../citizenPortal/public/data/amritsar_wards_final.geojson");

  const rawData = fs.readFileSync(filePath);
  const geoData = JSON.parse(rawData);

  await Ward.deleteMany({});

  const wards = geoData.features.map((feature, index) => ({
    wardNumber: index + 1,
    name: `Ward ${index + 1}`,
    geometry: feature.geometry
  }));

  await Ward.insertMany(wards);

  console.log("Wards Imported Successfully ✅");
  process.exit();
}

importWards();
