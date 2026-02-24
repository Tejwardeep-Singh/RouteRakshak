const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const WardOffice = require("../models/wardOffice");
const Ward = require("../models/ward");
const Complaint = require("../models/complaint");
const adminAuth = require("../middleware/adminAuth");
const Road = require("../models/road");
const recalculateRanks = require("../utils/recalculateRanks");

const router = express.Router();

const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });

router.get("/", async(req, res) => {
  const topWards = await Ward.find().sort({ rank: 1 }).limit(3);
  res.render(
    path.join(__dirname, "../../adminPortal/views/index.ejs"),{ topWards }
  );
});


router.get("/login", (req, res) => {
  res.render(
    path.join(__dirname, "../../adminPortal/views/login.ejs"),{
        error: req.query.error
    }
  );
});


router.get("/dashboard", adminAuth, async (req, res) => {

  const ward = await Ward.findOne({
    wardNumber: req.session.admin.ward_id
  });

  const topWards = await Ward.find().sort({ rank: 1 }).limit(3);

  const wardComplaints = await Complaint.find({
    wardNumber: ward.wardNumber
  });

  const pendingCount = wardComplaints.filter(c => c.status === "pending").length;
  const completedCount = wardComplaints.filter(c => c.status === "completed").length;

  
  const statusCounts = {
    pending: 0,
    "in-progress": 0,
    resolved: 0,
    completed: 0
  };

  wardComplaints.forEach(c => {
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }
  });

  res.render(
    path.join(__dirname, "../../adminPortal/views/dashboard.ejs"),
    {
      citizen: req.session.citizen,
      ward,
      topWards,
      pendingCount,
      completedCount,
      statusCounts   
    }
  );
});



router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await WardOffice.findOne({ username });
  if (!admin) return res.redirect("/admin/login?error=Invalid email or Password");

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.redirect("/admin/login?error=Invalid email or password");

  req.session.admin = {
    ward_id: admin.ward_id
  };

  res.redirect("/admin/dashboard");
});
router.get("/adminComplaints", async (req, res) => {
  try {

    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }

    const wardNumber = req.session.admin.ward_id;

 
    const complaints = await Complaint.find({ wardNumber })
      .sort({ createdAt: -1 });

      const complaints2 = await Complaint.find({
    wardNumber,
    status: "pending"
  }).sort({ createdAt: -1 });
    const ward = await Ward.findOne({ wardNumber });

    res.render(path.join(__dirname, "../../adminPortal/views/adminComplaint.ejs"), {
      complaints,
      complaints2,
      ward
    });

  } catch (err) {
    console.error(err);
    res.send("Error loading complaints");
  }
});
router.get("/complaint/:id", async (req, res) => {
  try {

    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.send("Complaint not found");
    }

    res.render(
      path.join(__dirname, "../../adminPortal/views/adminComplaintDetails.ejs"),
      { complaint }
    );

  } catch (err) {
    console.error(err);
    res.send("Error loading complaint");
  }
});
router.post("/resolve/:id", upload.single("afterImage"), async (req, res) => {
  try {

    const complaint = await Complaint.findById(req.params.id).populate("road");
    if (!complaint) {
      return res.send("Complaint not found");
    }

    
    complaint.status = "resolved";
    complaint.afterImage = req.file ? req.file.path : null;
    await complaint.save();

    
    if (complaint.road) {
      complaint.road.condition = "under_repair";
      await complaint.road.save();
    }
    // await recalculateRanks();
    await fetch("https://pathway-3gt1.onrender.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wardNumber: complaint.wardNumber,
        status: "resolved",
        createdAt: new Date()
      })
    });
    
    res.redirect("/admin/adminComplaints");

  } catch (err) {
    console.error(err);
    res.send("Error resolving complaint");
  }
});


router.get("/leaderboard", async (req, res) => {

  const wards = await Ward.find().sort({ rank: 1 });

  res.render(
    path.join(__dirname, "../../adminPortal/views/leaderboard.ejs"),
    { wards }
  );
});
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

module.exports = router;
