import express from "express";
import { decodeToken } from "../../../utils/hash";
import { getReferralCodeById } from "../../../controller/userController";

const referralRouter = express.Router();


referralRouter.get("/me", async (req, res) => {
	try {
		const { id_user } = req.body
		const referralCode = await getReferralCodeById(id_user);
		res.json(referralCode);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});

referralRouter.get(":id", async (req, res) => {
    try {
        const id = req.params.id;
        const referralCode = await getReferralCodeById(id);
        res.json(referralCode);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default referralRouter;