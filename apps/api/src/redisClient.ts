import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.REDIS_HOST || "localhost";
const port = process.env.REDIS_PORT || "6379";
const password = process.env.REDIS_PASSWORD || undefined;

const url = process.env.REDIS_URL || `redis://${host}:${port}`;

const redisClient = createClient({
    url,
    password,
});

redisClient.on('error', (err: any) => {
    console.error('Redis error:', err);
});

redisClient.on('ready', () => {
    console.log('Redis client is ready');
});

redisClient.connect()
    .then(() => console.log(`Connected to Redis at ${url}`))
    .catch((err) => console.error("Redis connection failed:", err));


export async function setObject(key: string, obj: any) {
    try {
        await redisClient.set(key, JSON.stringify(obj), { EX: 60 * 60 });
    } catch (err) {
        console.error('Error setting object:', err);
    }
}

export async function getObject(key: string) {
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Error getting object:', err);
        return null;
    }
}

export async function deleteKey(key: string) {
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error('Error deleting key:', err);
    }
}

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
