import express from "express";
import { ICrypto } from "../../../interfaces/ICrypto";
import { getCryptosByUserId } from "../../../controller/cryptoController";

const cryptoRouter = express.Router();

cryptoRouter.get("/", async (req, res) => {
    const { id_user } = req.body;
    try {
        const cryptos: ICrypto[] = await getCryptosByUserId(id_user);
        if (cryptos.length === 0) {
            return res.json([]);
        }
        res.json(cryptos);
    } catch (error: any) {
        console.error("Error getting cryptos", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default cryptoRouter;