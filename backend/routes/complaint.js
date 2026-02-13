const express = require("express");
const path = require("path");
const router = express.Router();
const Ward = require("../models/ward");
const Complaint = require("../models/complaint");
const recalculateRanks = require("../utils/recalculateRanks");
const multer = require("multer");
const { storage } = require("../config/cloudinary");  
const upload = multer({ storage });                   

router.post("/submitComplaint", upload.single("roadImage"), async (req, res) => {
  try {

    if (!req.session.citizen) {
      return res.redirect("/login");
    }

    const { message, locationText, latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.send("Location is required");
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const userName = req.session.citizen.name;
    const mobile = req.session.citizen.mobile;

    const ward = await Ward.findOne({
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          }
        }
      }
    });

    if (!ward) {
      return res.send("No ward found for this location");
    }

    const complaint = await Complaint.create({
      userName,
      mobile,
      message,
      locationText,
      wardNumber: ward.wardNumber,
      location: {
        type: "Point",
        coordinates: [lng, lat]
      },
      beforeImage: req.file ? req.file.path : null,
      status: "pending",
      verifiedByCitizen: false
    });

    await Ward.updateOne(
      { wardNumber: ward.wardNumber },
      { $inc: { complaintsCount: 1 } }
    );

    console.log("SAVED:", complaint);


    await recalculateRanks();

    return res.redirect("/dashboard?success=1");

  } catch (err) {
    console.error("ERROR:", err);
    return res.send("Error occurred: " + err.message);
  }
});





router.get("/citizenComplaint", (req, res) => {
  res.render(path.join(__dirname, "../../citizenPortal/views/complaint.ejs"));
});

module.exports = router;
