const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const WardOffice = require("../models/wardOffice");
const Ward = require("../models/ward");
const Complaint = require("../models/complaint");
const adminAuth = require("../middleware/adminAuth");
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
    path.join(__dirname, "../../adminPortal/views/login.ejs")
  );
});


router.get("/dashboard", adminAuth, (req, res) => {
  res.render(
    path.join(__dirname, "../../adminPortal/views/dashboard.ejs"),
    {
      ward_id: req.session.admin.ward_id
    }
  );
});


router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await WardOffice.findOne({ username });
  if (!admin) return res.redirect("/admin/login");

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.redirect("/admin/login");

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

    await Complaint.findByIdAndUpdate(req.params.id, {
      afterImage: req.file.path,
      status: "resolved"
    });
    await recalculateRanks();
    res.redirect("/admin/adminComplaints");

  } catch (err) {
    console.error(err);
    res.send("Error resolving complaint");
  }
});



router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

module.exports = router;
