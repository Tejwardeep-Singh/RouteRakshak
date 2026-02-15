const mongoose = require("mongoose");

const roadSchema = new mongoose.Schema({

  name: {
    type: String,
    default: "Unnamed Road"
  },

  geometry: {
    type: {
      type: String,
      enum: ["LineString"],
      required: true
    },
    coordinates: {
      type: [[Number]],   // [[lng, lat], ...]
      required: true
    }
  },

  condition: {
    type: String,
    enum: ["good", "damaged", "under_repair"],
    default: "good"
  },

  severity: {
    type: Number,  // 1–5 scale
    default: 1
  },

  complaintsCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

roadSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Road", roadSchema);
