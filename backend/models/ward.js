const mongoose = require("mongoose");

const WardSchema = new mongoose.Schema(
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

    total_complaints: {
      type: Number,
      default: 0
    },

    resolved_complaints: {
      type: Number,
      default: 0
    },

    road_health_score: {
      type: Number,
      default: 100
    },

    rank: {
      type: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ward", WardSchema);
