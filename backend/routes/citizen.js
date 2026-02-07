const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const Citizen = require("../models/citizen");
const citizenAuth = require("../middleware/citizenAuth");

const router = express.Router();


router.get("/", (req, res) => {
  res.render(path.join(__dirname, "../../citizenPortal/views/index.ejs"));
});


router.get("/register", (req, res) => {
  res.render(path.join(__dirname, "../../citizenPortal/views/register.ejs"));
});


router.get("/login", (req, res) => {
  res.render(path.join(__dirname, "../../citizenPortal/views/login.ejs"));
});


router.get("/dashboard", citizenAuth, (req, res) => {
  res.render(path.join(__dirname, "../../citizenPortal/views/dashboard.ejs"), {
    citizen: req.session.citizen
  });
});


router.post("/register", async (req, res) => {
  const { name, email, password, ward_id } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  await Citizen.create({
    name,
    email,
    password: hashedPassword,
    ward_id
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

module.exports = router;

