require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../connection/mongoose");
const bcrypt = require("bcrypt");

const Ward = require("../models/ward");
const WardOffice = require("../models/wardOffice");

async function createWardOffices() {
  try {
    await connectDB(); 

    const wards = await Ward.find();

    for (let ward of wards) {

      const username = `ward${ward.wardNumber}`;
      const password = `CityRank@${100 + ward.wardNumber}`;


      const existing = await WardOffice.findOne({ ward_id: ward.wardNumber });
      if (existing) {
        console.log(`Ward ${ward.wardNumber} already has login`);
        continue;
      }
      const rawPassword = `CityRank@${100 + ward.wardNumber}`;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      await WardOffice.create({
        ward_id: ward.wardNumber,
        ward_name: ward.name,
        username,
        password:hashedPassword
      });

      console.log(`Login created for Ward ${ward.wardNumber}`);
    }

    console.log("All ward logins created successfully");
    process.exit();

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createWardOffices();
