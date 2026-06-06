import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Place } from './models';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables or .env file!');
  process.exit(1);
}

// Interface representing txt review
interface ParsedReview {
  placeId: string;
  reviewObj: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  };
}

async function seed() {
  try {
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected successfully to MongoDB!');

    // 1. Read places.json
    const placesPath = path.join(__dirname, 'places.json');
    console.log(`📖 Reading places from ${placesPath}...`);
    const placesData = fs.readFileSync(placesPath, 'utf-8');
    const rawPlaces = JSON.parse(placesData);

    // 2. Read and parse reviews.txt
    const reviewsPath = path.join(__dirname, 'reviews.txt');
    console.log(`📖 Reading reviews from ${reviewsPath}...`);
    const reviewsData = fs.readFileSync(reviewsPath, 'utf-8');
    const lines = reviewsData.split('\n');

    const parsedReviews: ParsedReview[] = [];
    let reviewCounter = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue; // Skip empty lines and comments

      const parts = trimmed.split('|').map(p => p.trim());
      if (parts.length < 3) {
        console.warn(`⚠️ Skipping invalid review line: "${trimmed}"`);
        continue;
      }

      const placeId = parts[0];
      const rating = parseInt(parts[1], 10);
      const comment = parts[2];
      const createdAt = parts[3] || new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      if (isNaN(rating) || rating < 1 || rating > 5) {
        console.warn(`⚠️ Invalid rating for review: "${trimmed}". Skipping.`);
        continue;
      }

      parsedReviews.push({
        placeId,
        reviewObj: {
          id: `seed_rev_${reviewCounter++}`,
          rating,
          comment,
          createdAt
        }
      });
    }

    console.log(`📝 Parsed ${parsedReviews.length} reviews from text file.`);

    // 3. Clear existing places collection
    console.log('🗑️ Clearing existing places in database...');
    const deleteResult = await Place.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} items.`);

    // 4. Map reviews to places and insert
    console.log('🌱 Seeding database...');
    const seededPlaces = [];

    for (const place of rawPlaces) {
      // Find reviews that belong to this place
      const placeReviews = parsedReviews
        .filter(r => r.placeId === place.id)
        .map(r => r.reviewObj);

      const dbPlace = new Place({
        ...place,
        reviews: placeReviews
      });

      await dbPlace.save();
      seededPlaces.push(place.name);
      console.log(`  ➕ Imported: ${place.name} (${placeReviews.length} reviews)`);
    }

    console.log(`🎉 Seeding complete! Seeded ${seededPlaces.length} places successfully.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seed();
