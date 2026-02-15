const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const axios = require("axios");
const turf = require("@turf/turf");


const Citizen = require("../models/citizen");
const WardOffice = require("../models/wardOffice");
const Ward = require("../models/ward");
const Complaint = require("../models/complaint");
const citizenAuth = require("../middleware/citizenAuth");
const recalculateRanks = require("../utils/recalculateRanks");
const Road = require("../models/road");



const router = express.Router();


router.get("/", async(req, res) => {
  const topWards = await Ward.find().sort({ rank: 1 }).limit(3);
  res.render(path.join(__dirname, "../../citizenPortal/views/index.ejs"),{topWards});
});


router.get("/register", (req, res) => {
  res.render(path.join(__dirname, "../../citizenPortal/views/register.ejs"));
});


router.get("/login", (req, res) => {
  res.render(path.join(__dirname, "../../citizenPortal/views/login.ejs"));
});


router.get("/dashboard", citizenAuth, async (req, res) => {

  const ward = await Ward.findOne({
    wardNumber: req.session.citizen.ward_id
  });

  const wardComplaints = await Complaint.find({
    wardNumber: ward.wardNumber
  });

  const yourComplaints = await Complaint.find({
    userName: req.session.citizen.name
  });

  const pendingCount = wardComplaints.filter(c => c.status === "pending").length;
  const completedCount = wardComplaints.filter(c => c.status === "completed").length;

  res.render(
    path.join(__dirname, "../../citizenPortal/views/dashboard.ejs"),
    {
      citizen: req.session.citizen,
      ward,
      yourComplaints,
      pendingCount,
      completedCount
    }
  );
});


router.post("/verify/:id", async (req, res) => {
  try {

    if (!req.session.citizen) {
      return res.redirect("/login");
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.send("Complaint not found");
    }

    
    complaint.status = "completed";
    complaint.verifiedByCitizen = true;
    await complaint.save();

    
    const road = await Road.findOne({
      geometry: {
        $near: {
          $geometry: complaint.location,
          $maxDistance: 50
        }
      }
    });

    if (road) {
      road.condition = "good";
      await road.save();
    }

    res.redirect("/dashboard");

  } catch (err) {
    console.error(err);
    res.send("Verification failed");
  }
});


// router.post("/register", async (req, res) => {

//   const { name,area,mobile, email, password, latitude, longitude } = req.body;

//   if (!latitude || !longitude) {
//     return res.send("Location is required for registration");
//   }

//   const lat = parseFloat(latitude);
//   const lng = parseFloat(longitude);

//   const ward = await Ward.findOne({
//     geometry: {
//       $geoIntersects: {
//         $geometry: {
//           type: "Point",
//           coordinates: [lng, lat]
//         }
//       }
//     }
//   });

//   if (!ward) {
//     return res.send("No ward found for your location");
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   await Citizen.create({
//     name,
//     email,
//     mobile,
//     area,
//     password: hashedPassword,
//     ward_id: ward.wardNumber
//   });

//   res.redirect("/login");
// });

router.post("/register", async (req, res) => {

  const { name, email, password, latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.send("Location is required for registration");
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

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
    return res.send("Registration allowed only for Amritsar residents.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await Citizen.create({
    name,
    email,
    password: hashedPassword,
    ward_id: ward.wardNumber
  });

  res.redirect("/login");
});



router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const citizen = await Citizen.findOne({ email });
  if (!citizen) return res.redirect("/login");

  const match = await bcrypt.compare(password, citizen.password);
  if (!match) return res.redirect("/login");

  req.session.citizen = {
    id: citizen._id,
    ward_id: citizen.ward_id,
    name: citizen.name
  };

  res.redirect("/dashboard");
});


router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

router.get("/leaderboard", async (req, res) => {

  const wards = await Ward.find().sort({ rank: 1 });

  res.render(
    path.join(__dirname, "../../citizenPortal/views/leaderboard.ejs"),
    { wards }
  );
});


router.post("/safe-route", async (req, res) => {

  try {

    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ error: "Source and destination required" });
    }

    
    const isLatLng = (val) => val.includes(",");

   
    const geocode = async (place) => {

      
      if (isLatLng(place)) {
        const parts = place.split(",");
        return [parseFloat(parts[1]), parseFloat(parts[0])];
      }

      const response = await axios.get(
        "https://api.openrouteservice.org/geocode/search",
        {
          params: {
            text: place + ", Amritsar, Punjab, India",
            size: 1
          },
          headers: {
            Authorization: process.env.ORS_API_KEY
          }
        }
      );

      if (!response.data.features.length) {
        throw new Error("Location not found: " + place);
      }

      return response.data.features[0].geometry.coordinates;
    };

    const start = await geocode(source);
    const end = await geocode(destination);

    
    const orsResponse = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        coordinates: [start, end]
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const routes = orsResponse.data.features;

    if (!routes || routes.length === 0) {
      return res.status(400).json({ error: "No routes found" });
    }

    
    const damagedRoads = await Road.find({
      condition: { $in: ["damaged", "under_repair"] }
    });

   
    let safestRoute = routes[0];
    let lowestRisk = Infinity;

    for (let route of routes) {

      let risk = 0;
      const routeCoords = route.geometry.coordinates;

      damagedRoads.forEach(road => {

        if (!road.geometry || !road.geometry.coordinates) return;

        const roadCoords = road.geometry.coordinates;

        routeCoords.forEach(rp => {
          roadCoords.forEach(cp => {

            const dx = rp[0] - cp[0];
            const dy = rp[1] - cp[1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.0005) {  // ~50m
              risk += 10;
            }

          });
        });

      });

      if (risk < lowestRisk) {
        lowestRisk = risk;
        safestRoute = route;
      }
    }


    return res.json({ route: safestRoute });

  } catch (err) {

    console.error("Routing Error:", err.message);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Routing failed",
        details: err.message
      });
    }
  }
});



module.exports = router;

