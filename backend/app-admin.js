require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./connection/mongoose");
const session = require("express-session");

const app = express();

// Connect DB
connectDB();

const recalculateRanks = require("./utils/recalculateRanks");
recalculateRanks().then(() => {
  console.log("Initial ranking calculated.");
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60
    }
  })
);

// Static files (Admin only)
app.use(express.static(path.join(__dirname, "../adminPortal/public")));

// Views folder
app.set("views", path.join(__dirname, "../adminPortal/views"));

// Routes
const adminPages = require("./routes/admin");

app.use("/", adminPages);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Admin Server running on port ${PORT}`);
});