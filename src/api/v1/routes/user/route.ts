import express from "express";
import { getAllUsers, getReferralCodeById, getUserById, getUserQuotesById, getUsersBySearch } from "../../controller/userController";
import { IUser } from "../../interfaces/IUser";
import { decodeToken } from "../../utils/hash";

const userRouter = express.Router();

// Get all users
// userRouter.get("/", async (req, res) => {
// 	try {
// 		const users: IUser[] = await getAllUsers();
// 		res.json(users);
// 	} catch (error) {
// 		res.status(500).json({ error: "Internal server error" });
// 	}
// });

// Get user by id
userRouter.get("/", async (req, res) => {
	try {
		const { id_user } = await decodeToken(req);
		const user: IUser = await getUserById(id_user);
		const formattedUser: IUser = {
			str_username: user.str_username,
			date_creation: user.date_creation,
		};
		return res.json(formattedUser);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

userRouter.get("/search", async (req, res) => {
	try {
		const search = req.query.search as string;
		if (!search) {
			return res.status(400).json({ error: "Search query is required" });
		}
		const users: IUser[] = await getUsersBySearch(search, 10);
		res.json(users);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

userRouter.get("/quotes", async (req, res) => {
	try {
		const { id_user } = req.body;
		const quotes = await getUserQuotesById(id_user);
		res.json(quotes);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

export default userRouter;
