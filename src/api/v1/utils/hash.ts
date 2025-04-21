import { createHash } from "crypto";
import jwt from "jsonwebtoken";
import { IDecodedToken } from "../interfaces/IDecodedToken";
import { Request } from "express";

export async function generateHash(password: string): Promise<string> {
	const hash = createHash("sha256");
	hash.update(password);
	return hash.digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
	return await generateHash(password);
}

export async function comparePassword(
	password: string,
	hashedPassword: string
): Promise<boolean> {
	return (await generateHash(password)) === hashedPassword;
}

export async function generateToken(payload: string | object): Promise<string> {
	return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
		expiresIn: "15m",
	});
}

export async function generateRefreshToken(
	payload: string | object
): Promise<string> {
	return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
		expiresIn: "7d",
	});
}

export async function verifyToken(token: string): Promise<IDecodedToken> {
	return jwt.verify(
		token,
		process.env.JWT_ACCESS_SECRET as string
	) as IDecodedToken;
}

export async function verifyRefreshToken(token: string): Promise<IDecodedToken> {
	return jwt.verify(
		token,
		process.env.JWT_REFRESH_SECRET as string
	) as IDecodedToken;
}

export async function decodeToken(req: Request): Promise<IDecodedToken> {
	return jwt.decode(
		req.headers.authorization?.split(" ")[1] as string
	) as IDecodedToken;
}
