import { NextFunction, Response } from "express";
import { generateToken, verifyRefreshToken, verifyToken } from "../utils/hash";
import { IDecodedToken } from "../interfaces/IDecodedToken";
import { DISCORD_API_BASE_PATH } from "../utils/constants";
import { getUserByUsername } from "../controller/userController";

export const authenticateToken = (
	req: any,
	res: Response,
	next: NextFunction
) => {
	const authHeader = req.headers.authorization?.split(" ")[1];
	const authType = req.headers["x-oauth-type"];
	const token = authHeader;
	const refreshToken = req.headers["x-refresh-token"];
	
	if (token == null || refreshToken == null) return res.sendStatus(401);
	try {
		if (authType === "discord") {
			fetch(`${DISCORD_API_BASE_PATH}/oauth2/@me`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
				.then((response) => {
					if (!response.ok) throw new Error("Access token expired");

					return response.json();
				})
				.then(async (data) => {
					req.user = data;
					req.body.id_user = (await getUserByUsername(data.user.username)).id_user
					next();
				})
				.catch((error) => {
					res.sendStatus(401);
				});
		} else {
			verifyToken(token)
				.then((user: IDecodedToken) => {
					req.user = user;
					req.body.id_user = user.id_user;
					next();
				})
				.catch((error: any) => {
					if (error.message === "jwt expired") {
						verifyRefreshToken(refreshToken)
							.then((user: IDecodedToken) => {
								generateToken({
									id_user: user.id_user,
									str_username: user.str_username,
									str_email: user.str_email,
									bl_admin: user.bl_admin,
								})
									.then((token: string) => {
										req.user = user;
										req.body.id_user = user.id_user;
										res.setHeader("Authorization", `Bearer ${token}`);
										next();
									})
									.catch((error: any) => {
										res.sendStatus(403);
									});
							})
							.catch((error) => {
								res.sendStatus(401);
							});
					} else {
						res.sendStatus(401);
					}
				});
		}
	} catch (error) {
		res.sendStatus(500);
	}
};
