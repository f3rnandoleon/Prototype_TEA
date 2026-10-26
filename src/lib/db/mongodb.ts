import mongoose from 'mongoose';
import dns from 'dns';

// Solución para resolución de registros SRV en MongoDB Atlas en Node.js sobre Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignorar si el entorno bloquea la modificación de servidores DNS
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tea_platform';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  // Asegurar DNS público en Windows para registros SRV
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Ignorar si no está permitido
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tea_platform';

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
