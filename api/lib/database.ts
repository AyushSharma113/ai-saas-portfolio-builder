import mongoose from "mongoose";

// load mongodb connection uri from the env
const MONGO_URI = process.env.MONGO_URI;

// ensure the mongo uri is defined
if (!MONGO_URI) {
  if (process.env.NODE_ENV === "development") {
    throw new Error(
      "❌ Please define the MONGODB_URI environment variable in .env.local",
    );
  }
}

// interface for caching the mongoose connection ascross hot reloads in devlopment
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// use a global varible to  persist connection cache across reloads in dev
declare global {
  var myMongoose: MongooseCache | undefined;
}

// initialize cache object if not already defined
let cached = global.myMongoose;

if (!cached) {
  cached = global.myMongoose = { conn: null, promise: null };
}

/**
 * Asynchronously connects to the mongo database using mongoose
 * reuse existing connection if available (important for local development)
 *
 * @returns the mongoose connection instance
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return cached connection if exist
  if (cached!.conn) {
    return cached!.conn;
  }

  // if not already connecting , create a new connection
  if (!cached!.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering for better error visibility
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // Time to wait for server selection
      socketTimeoutMS: 45000, // Socket timeout
      family: 4, // Use IPv4
    };

    // Initiate the connection
    cached!.promise = mongoose.connect(MONGO_URI!, opts).then((mongoose) => {
      console.log("connected to mongodb");
      return mongoose;
    });
  }

    try {
    // Await the connection and cache it
    cached!.conn = await cached!.promise;
  } catch (e) {
    // Reset the promise on failure for retry
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
  
  
}
