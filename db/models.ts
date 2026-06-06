import mongoose from 'mongoose';

// Branch schema for other branches/locations
const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }
});

// Review schema for restaurant/cafe feedback
const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: String, required: true }
});

// Main Place schema (restaurant / drink place)
const PlaceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Custom ID matching f1, f2, custom_xxx
  name: { type: String, required: true },
  type: { type: String, enum: ['food', 'drink'], required: true },
  category: { type: String },
  location: {
    ward: { type: String, required: true },
    addressDetail: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    googleMapsUrl: { type: String }
  },
  description: { type: String },
  priceRange: { type: String },
  bestWeather: [{ type: String }],
  recommendationReason: { type: String },
  branches: [BranchSchema],
  reviews: [ReviewSchema]
});

export const Place = mongoose.models.Place || mongoose.model('Place', PlaceSchema);
