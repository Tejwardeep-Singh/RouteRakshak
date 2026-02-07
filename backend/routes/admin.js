const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const WardOffice = require("../models/wardOffice");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


router.get("/", (req, res) => {
  res.render(
    path.join(__dirname, "../../adminPortal/views/index.ejs")
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


router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

module.exports = router;
