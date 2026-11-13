import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer = null;
let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const externalUri = process.env.MONGODB_URI?.trim();
    const useExternal = Boolean(externalUri && !externalUri.includes('MY_'));

    let mongoUri = externalUri;
    if (!useExternal) {
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'grandstay',
        },
      });
      mongoUri = memoryServer.getUri();
    }

    await mongoose.connect(mongoUri, {
      dbName: 'grandstay',
    });

    console.log(
      `[MongoDB] Connected (${useExternal ? 'External Cluster' : 'Embedded MongoMemoryServer'})`
    );
    return mongoose.connection;
  })();

  return connectionPromise;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
  connectionPromise = null;
}
