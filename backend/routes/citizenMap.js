const express = require("express");
const path = require("path");
const router = express.Router();
const Road = require("../models/road");

router.get("/", async(req, res) => {
  const roads = await Road.find({});
  res.render(
    path.join(__dirname, "../../citizenPortal/views/map.ejs"),{ roads }
  );
});

module.exports = router;
