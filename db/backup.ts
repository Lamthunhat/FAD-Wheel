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

async function backup() {
  try {
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI!);
    console.log('✅ Connected successfully to MongoDB!');

    console.log('📖 Fetching all places from database...');
    const places = await (Place as any).find({}).lean();
    console.log(`📝 Found ${places.length} places in database.`);

    const placesPath = path.join(__dirname, 'places.json');
    console.log(`💾 Writing database backup to ${placesPath}...`);

    // Clean up MongoDB internal fields (_id and __v) for clean JSON storage
    const cleanedPlaces = places.map((place: any) => {
      const { _id, __v, ...rest } = place;
      if (rest.reviews) {
        rest.reviews = rest.reviews.map((rev: any) => {
          const { _id, ...rRest } = rev;
          return rRest;
        });
      }
      return rest;
    });

    fs.writeFileSync(placesPath, JSON.stringify(cleanedPlaces, null, 2), 'utf-8');
    console.log('🎉 Backup complete successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup failed with error:', error);
    process.exit(1);
  }
}

backup();
