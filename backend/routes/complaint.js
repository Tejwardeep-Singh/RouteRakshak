const express = require("express");
const path = require("path");
const router = express.Router();
const Ward = require("../models/ward");
const Complaint = require("../models/complaint");
const recalculateRanks = require("../utils/recalculateRanks");
const Road = require("../models/road");
const multer = require("multer");
const { storage } = require("../config/cloudinary");  
const upload = multer({ storage });                  
const fs = require("fs");

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

    
    let road = await Road.findOne({
      geometry: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: 50
        }
      }
    });

    
    if (!road) {
      road = await Road.create({
        name: "Unnamed Road",
        geometry: {
          type: "LineString",
          coordinates: [
            [lng, lat],
            [lng + 0.0002, lat + 0.0002]
          ]
        },
        condition: "damaged",
        severity: 3,
        complaintsCount: 1
      });
    } else {
      
      road.condition = "damaged";
      road.severity = Math.min(5, road.severity + 1);
      road.complaintsCount += 1;
      await road.save();
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
      verifiedByCitizen: false,
      road: road._id
    });
    const eventsPath = path.join(__dirname, "../pathway/events.jsonl");

    fs.appendFileSync(
      eventsPath,
      JSON.stringify({
        wardNumber: ward.wardNumber,
        status: "pending"
      }) + "\n"
    );
        

    
    // await recalculateRanks();

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
