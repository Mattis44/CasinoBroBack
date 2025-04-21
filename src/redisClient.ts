// redisClient.ts
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD,
});

redisClient.connect().then(() => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err: any) => {
  console.error('Redis error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client is ready');
});

// Function to set an object in Redis
export async function setObject(key: string, obj: any) {
    try {
        await redisClient.set(key, JSON.stringify(obj));
        console.log(`Object set for key: ${key}`);
    } catch (err) {
        console.error('Error setting object:', err);
    }
}

// Function to get an object from Redis
export async function getObject(key: string) {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Error getting object:', err);
        return null;
    }
}

// Function to delete a key from Redis
export async function deleteKey(key: string) {
    try {
        await redisClient.del(key);
        console.log(`Key deleted: ${key}`);
    } catch (err) {
        console.error('Error deleting key:', err);
    }
}

// Function to check if a key exists
export async function keyExists(key: string) {
    try {
        const exists = await redisClient.exists(key);
        return exists === 1;
    } catch (err) {
        console.error('Error checking if key exists:', err);
        return false;
    }
}

export default redisClient;
