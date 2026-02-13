const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema({
  wardNumber: Number,
  name: String,

  complaintsCount: {
    type: Number,
    default: 0
  },

  completedCount: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },

  score: {
    type: Number,
    default: 0
  },

  geometry: {
    type: {
      type: String,
      enum: ["Polygon", "MultiPolygon"],
      required: true
    },
    coordinates: {
      type: Array,
      required: true
    }
  }
});


wardSchema.index({ geometry: "2dsphere" });

module.exports = mongoose.model("Ward", wardSchema);
