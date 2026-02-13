const express = require("express");
const router = express.Router();
const Ward = require("../models/ward");

router.get("/", async (req, res) => {
  try {
    const lat = 31.6340;
    const lng = 74.8723;

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
      return res.json({ message: "No ward found" });
    }

    res.json({
      wardNumber: ward.wardNumber,
      name: ward.name
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error detecting ward" });
  }
});

module.exports = router;
