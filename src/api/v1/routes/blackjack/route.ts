import express from "express";
import {
    doubleDown,
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
            playerCards: {
                firstHand: formattedPlayerCards,
                secondHand: [],
            },
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
    const {
        action,
        id_user,
        handIndex,
        splitMode,
    }: { action: ActionType; id_user: string; handIndex?: number, splitMode?: boolean } = req.body;
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
                if (typeof handIndex !== "number") {
                    return res.status(400).json("Missing hand index for hit.");
                }
                console.log(gameState.playerHandValue);
                
                const canHit =
                    gameState.playerHandValue[handIndex] < 21 &&
                    ((Array.isArray(gameState.status) && gameState.status.includes("stand")) ||
                    gameState.status === "in_progress") &&
                    gameState.playerCards.firstHand.length > 0;

                if (!canHit) {
                    return res.status(400).json("Cannot hit at this time.");
                }

                const hitResult = await hitCard(gameState, handIndex);
                res.status(200).json(hitResult);
                break;
            case ActionType.STAND:
                if (typeof handIndex !== "number") {
                    return res.status(400).json("Missing hand index for hit.");
                }
                const canStand =
                    gameState.playerHandValue[handIndex] < 21 &&
                    ((Array.isArray(gameState.status) && gameState.status.includes("stand")) ||
                    gameState.status === "in_progress") &&
                    gameState.playerCards.firstHand.length > 0;
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
                } = await stand(gameState, handIndex, splitMode);
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
                    gameState.status === "in_progress" &&
                    gameState.playerCards.firstHand.length > 0 &&
                    gameState.playerCards.secondHand.length === 0;
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
            case ActionType.DOUBLE:
                if (typeof handIndex !== "number") {
                    return res.status(400).json("Missing hand index for double.");
                }
                const canDouble =
                    gameState.playerHandValue[handIndex] < 21 &&
                    ((Array.isArray(gameState.status) && gameState.status.includes("stand")) ||
                    gameState.status === "in_progress") &&
                    gameState.playerCards.firstHand.length > 0;
                if (!canDouble) {
                    return res.status(400).json("Cannot double at this time.");
                }

                const doubleResult = await doubleDown(gameState, handIndex, splitMode);
                res.status(200).json(doubleResult);

        }
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

export default blackjackRouter;
