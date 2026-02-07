require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./connection/mongoose");
const session = require("express-session");

const app = express();
connectDB();

// body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret: "cityrank_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 // 1 hour
    }
  })
);

// STATIC FILES (optional but recommended)
app.use("/public", express.static(path.join(__dirname, "../citizenPortal/public")));
app.use("/admin/public", express.static(path.join(__dirname, "../adminPortal/public")));

// ROUTES
const citizenPages = require("./routes/citizen");
const adminPages = require("./routes/admin");

app.use("/", citizenPages);
app.use("/admin", adminPages);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
