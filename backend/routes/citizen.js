const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const Citizen = require("../models/citizen");
const WardOffice = require("../models/wardOffice");
const Ward = require("../models/ward");
const Complaint = require("../models/complaint");
const citizenAuth = require("../middleware/citizenAuth");
const recalculateRanks = require("../utils/recalculateRanks");

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


router.post("/verify/:id", citizenAuth, async (req, res) => {

  await Complaint.findByIdAndUpdate(req.params.id, {
    status: "completed",
    verifiedByCitizen: true
  });
  await recalculateRanks();
  res.redirect("/dashboard");
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

  // 🚨 OUTSIDE CITY BLOCK
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


module.exports = router;

