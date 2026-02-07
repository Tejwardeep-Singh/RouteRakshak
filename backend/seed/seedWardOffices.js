require("dotenv").config();
const bcrypt = require("bcrypt");
const connectDB = require("../connection/mongoose");
const WardOffice = require("../models/wardOffice");

const seedAdmins = async () => {
  try {
    await connectDB();
    await WardOffice.deleteMany();

    const admins = [];

    for (let i = 1; i <= 3; i++) {
      const hashedPassword = await bcrypt.hash(`ward${i}@123`, 10);

      admins.push({
        ward_id: i,
        ward_name: `Ward ${i}`,
        username: `ward${i}`,
        password: hashedPassword
      });
    }

    await WardOffice.insertMany(admins);
    console.log("Ward offices seeded successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmins();
