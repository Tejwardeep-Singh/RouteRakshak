const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    citizen_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Citizen",
      required: true
    },

    ward_id: {
      type: Number,
      required: true
    },

    type: {
      type: String,
      enum: ["pothole", "bad_road", "water_logging", "accident_prone"],
      required: true
    },

    severity: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    location: {
      lat: Number,
      lng: Number
    },

    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", ComplaintSchema);
