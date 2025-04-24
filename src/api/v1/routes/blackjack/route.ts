import express from "express";
import {
    hitCard,
    initBlackjackGame,
    retrieveGameState,
    splitCards,
    stand,
} from "../../controller/blackjackController";
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
            gameStatus: status,
        });
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

blackjackRouter.post("/", async (req, res) => {
    const { action, id_user }: { action: ActionType; id_user: string } =
        req.body;
    if (!action || !id_user) {
        return res.status(400).json("Missing action or id_user");
    }
    if (!Object.values(ActionType).includes(action)) {
        return res.status(400).json("Invalid action type");
    }

    try {
        const gameState = await retrieveGameState(id_user);
        if (!gameState) {
            return res.status(404).json("Game not found or expired.");
        }

        switch (action) {
            case ActionType.HIT:
                const canHit =
                    gameState.playerHandValue < 21 &&
                    gameState.status === "in_progress";
                if (!canHit) {
                    return res.status(400).json("Cannot hit at this time.");
                }
                const {
                    gameId: hitGameId,
                    formattedPlayerCards: hitFormattedPlayerCards,
                    formattedDealerCards: hitFormattedDealerCards,
                    playerHandValue: hitPlayerHandValue,
                    dealerHandValue: hitDealerHandValue,
                    hash: hitHash,
                    status: hitStatus,
                } = await hitCard(gameState);
                res.status(200).json({
                    gameId: hitGameId,
                    playerCards: hitFormattedPlayerCards,
                    dealerCards: hitFormattedDealerCards,
                    playerHandValue: hitPlayerHandValue,
                    dealerHandValue: hitDealerHandValue,
                    hash: hitHash,
                    gameStatus: hitStatus,
                });
                break;
            case ActionType.STAND:
                const canStand =
                    gameState.playerHandValue < 21 &&
                    gameState.status === "in_progress";
                if (!canStand) {
                    return res.status(400).json("Cannot stand at this time.");
                }

                const {
                    gameId: standGameId,
                    formattedPlayerCards: standFormattedPlayerCards,
                    formattedDealerCards: standFormattedDealerCards,
                    playerHandValue: standPlayerHandValue,
                    dealerHandValue: standDealerHandValue,
                    hash: standHash,
                    status: standStatus,
                } = await stand(gameState);
                res.status(200).json({
                    gameId: standGameId,
                    playerCards: standFormattedPlayerCards,
                    dealerCards: standFormattedDealerCards,
                    playerHandValue: standPlayerHandValue,
                    dealerHandValue: standDealerHandValue,
                    hash: standHash,
                    gameStatus: standStatus,
                });
                break;
            case ActionType.SPLIT:
                const canSplit =
                    gameState.playerHandValue < 21 &&
                    gameState.status === "in_progress" &&
                    gameState.playerCards.length === 2 &&
                    gameState.playerCards[0].value ===
                        gameState.playerCards[1].value;
                if (!canSplit) {
                    return res.status(400).json("Cannot split at this time.");
                }
                const {
                    gameId: splitGameId,
                    formattedPlayerCards: splitFormattedPlayerCards,
                    formattedDealerCards: splitFormattedDealerCards,
                    playerHandValue: splitPlayerHandValue,
                    dealerHandValue: splitDealerHandValue,
                    hash: splitHash,
                    status: splitStatus,
                } = await splitCards(gameState);
                res.status(200).json({
                    gameId: splitGameId,
                    playerCards: splitFormattedPlayerCards,
                    dealerCards: splitFormattedDealerCards,
                    playerHandValue: splitPlayerHandValue,
                    dealerHandValue: splitDealerHandValue,
                    hash: splitHash,
                    gameStatus: splitStatus,
                });
                break;
        }
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

export default blackjackRouter;
