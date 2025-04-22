import express from "express";
import { setObject } from "../../../../redisClient";
import { initBlackjackGame, retrieveGameState } from "../../controller/blackjackController";
const blackjackRouter = express.Router();

enum ActionType {
    HIT = "hit",
    STAND = "stand",
    DOUBLE = "double",
    SPLIT = "split",
}

blackjackRouter.post("/bet", async (req, res) => {
    try {
        const { id_user, bet_amount } = req.body;
        if (!id_user || !bet_amount) {
            return res.status(400).json("Missing id_user or bet_amount");
        }
        const {
            gameId,
            formattedPlayerCards,
            formattedDealerCards,
            playerHandValue,
            dealerHandValue,
            hash,
            status,
        } = await initBlackjackGame(id_user, bet_amount);
        res.status(200).json({
            gameId,
            playerCards: formattedPlayerCards,
            dealerCards: [formattedDealerCards[0], { hidden: true }],
            playerHandValue,
            dealerHandValue,
            hash,
            gameStatus: "blackjack",
        });
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

blackjackRouter.post("/:game_id", async (req, res) => {
    const { game_id } = req.params;
    const { action, id_user }: { action: ActionType, id_user: string} = req.body;

    try {
        const gameState = await retrieveGameState(game_id, id_user)
        console.log(gameState);
        
        res.status(200).json(gameState);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

export default blackjackRouter;
