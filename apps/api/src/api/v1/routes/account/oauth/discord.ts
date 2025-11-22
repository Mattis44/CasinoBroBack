import express from "express";
import {
	createUser,
	getUserByUsername,
	isAdminById,
} from "../../../controller/userController";
import { IUser } from "../../../interfaces/IUser";
import { DISCORD_API_BASE_PATH } from "../../../utils/constants";

const discordRouter = express.Router();

discordRouter.post("/register", async (req, res) => {
	try {
		const code = req.query.code as string;
		const result = await fetch(`${DISCORD_API_BASE_PATH}/users/@me`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${code}`,
			},
		});
		const user_datas: any = await result.json();

		const user: IUser = {
			str_username: user_datas.username,
			str_email: user_datas.email,
		};
		const newUser: IUser = await createUser(user);
		if (newUser === null) {
			res.status(403);
		}
		res.json(newUser);
	} catch (error: any) {
		res.status(500).json(error.message);
	}
});

discordRouter.post("/me", async (req, res) => {
	const { access_token, refresh_token } = req.body;

	try {
		console.log(access_token, refresh_token);

		let result;
		result = await fetch(`${DISCORD_API_BASE_PATH}/oauth2/@me`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		});

		if (result.status !== 200) {
			const refresh = await fetch(`${DISCORD_API_BASE_PATH}/oauth2/token`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: process.env.DISCORD_CLIENT_ID as string,
					client_secret: process.env.DISCORD_CLIENT_SECRET as string,
					grant_type: "refresh_token",
					refresh_token: refresh_token,
				}),
			});
			const refresh_datas: any = await refresh.json();
			result = await fetch(`${DISCORD_API_BASE_PATH}/users/@me`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${refresh_datas.access_token}`,
				},
			});
		}
		const user_datas = await result.json();
		const user: IUser = await getUserByUsername(user_datas.user.username);

		res.json({
			access_token: access_token,
			user: user,
		});
	} catch (error: any) {
		res.status(500).json(error.message);
	}
});

export default discordRouter;
