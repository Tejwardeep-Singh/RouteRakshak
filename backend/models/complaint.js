const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  userName:String,
  title: String,
  mobile:Number,
  description: String,
  wardNumber: Number,
  message: {
    type: String,
    required: true
  },

  locationText: {
    type: String,
    required: true
  },


  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], 
      required: true
    }
  },

  roadGeometry: {
    type: {
      type: String,
      enum: ["LineString"]
    },
    coordinates: {
      type: [[Number]]
    }
  },


  beforeImage: {
    type: String
  },

 
  afterImage: {
    type: String
  },


  status: {
    type: String,
    enum: ["pending", "in-progress", "resolved", "completed"],
    default: "pending"
  },


  verifiedByCitizen: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

complaintSchema.index({ location: "2dsphere" });

module.exports =
  mongoose.models.Complaint ||
  mongoose.model("Complaint", complaintSchema);
