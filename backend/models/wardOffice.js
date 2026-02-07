const mongoose = require("mongoose");

const WardOfficeSchema = new mongoose.Schema(
  {
    ward_id: {
      type: Number,
      required: true,
      unique: true
    },

    ward_name: {
      type: String,
      required: true
    },

    username: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    last_login: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WardOffice", WardOfficeSchema);
