import { getObject, setObject } from "../../../redisClient";
import crypto from "crypto";

const gameKey = "blackjack:game:user";

const seededRandom = (seed: number) => {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

function hashToSeed(input: string): { seed: number; hash: string } {
    const hash = crypto.createHash("sha256").update(input).digest("hex");
    const seed = parseInt(hash.slice(0, 8), 16);
    return { seed, hash };
}

export const shuffleDeck = (deck: any[]) => {
    const timestamp = Date.now().toString();
    const { seed, hash } = hashToSeed(timestamp);
    const random = seededRandom(seed);

    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
        shuffledDeck: shuffled,
        hash,
    };
};

const suits = ["spades", "hearts", "diamonds", "clubs"];
const values = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
];

const valueMap = {
    A: [1, 11],
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 10,
    Q: 10,
    K: 10,
};

const fullDeck = (numDecks = 1) => {
    const deck = [];
    for (let d = 0; d < numDecks; d++) {
        for (const suit of suits) {
            for (const value of values) {
                deck.push({ suit, value });
            }
        }
    }
    return deck;
};

const calculateHandValue = (
    cards: { suit: string; value: keyof typeof valueMap }[]
) => {
    let value = 0;
    let aces = 0;

    cards.forEach((card) => {
        if (card.value === "A") {
            aces++;
            value += 11;
        } else {
            value += valueMap[card.value];
        }
    });

    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
};

export const initBlackjackGame = async (
    id_user: string,
    bet_amount: number
) => {
    try {
        // Check if the user already has a game in progress
        // Check if the user has enough balance
        // Remove the bet amount from the user's balance
        const gameId = crypto.randomUUID();
        let { shuffledDeck: deck, hash } = shuffleDeck(fullDeck(6));

        const playerCards = [deck.pop(), deck.pop()];
        const dealerHiddenCard = deck.pop();
        const dealerVisibleCard = deck.pop();
        const dealerCards = [dealerVisibleCard];

        const formatCard = (card: {
            suit: string;
            value: keyof typeof valueMap;
        }) => ({
            ...card,
            equal: valueMap[card.value as keyof typeof valueMap] || 0,
        });

        const formattedPlayerCards = playerCards.map(formatCard);
        const formattedDealerCards = dealerCards.map(formatCard);

        const playerHandValue = [calculateHandValue(formattedPlayerCards)];
        const dealerHandValue = calculateHandValue(
            formattedDealerCards[0] ? [formattedDealerCards[0]] : []
        );
        let status = "in_progress";

        const gameState = {
            gameId,
            id_user,
            bet_amount,
            playerCards: {
                firstHand: formattedPlayerCards,
                secondHand: [],
            },
            dealerCards: formattedDealerCards,
            remainingDeck: deck,
            status,
            createdAt: new Date(),
            playerHandValue,
            dealerHandValue,
            dealerHiddenCard,
            hash,
        };
        if (playerHandValue[0] === 21) {
            status = "blackjack";
        } else {
            await setObject(`${gameKey}:${id_user}`, gameState);
        }

        return {
            gameId,
            formattedPlayerCards,
            formattedDealerCards,
            playerHandValue,
            dealerHandValue,
            hash,
            status,
        };
    } catch (error) {
        console.error("Error initializing blackjack game:", error);
        throw error;
    }
};

export const retrieveGameState = async (id_user: string) => {
    try {
        const gameState = await getObject(`${gameKey}:${id_user}`);
        if (!gameState) {
            throw new Error("Game not found or expired.");
        }

        return gameState;
    } catch (error) {
        console.error("Error retrieving game state:", error);
        throw error;
    }
};

export async function hitCard(gameState: any, handIndex: number = 0) {
    const hand =
        handIndex === 0
            ? gameState.playerCards.firstHand
            : gameState.playerCards.secondHand;
    const value =
        handIndex === 0
            ? gameState.playerHandValue[0]
            : gameState.playerHandValue[1];

    if (value >= 21) {
        throw new Error("Cannot hit, hand is already 21 or more.");
    }

    const card = gameState.remainingDeck.pop();
    hand.push(card);

    gameState.playerHandValue[handIndex] = calculateHandValue(hand);

    // Check for bust
    if (gameState.playerHandValue[handIndex] > 21) {
        gameState.status = "bust";
    }

    await setObject(`${gameKey}:${gameState.id_user}`, gameState);

    return {
        gameId: gameState.gameId,
        playerCards: gameState.playerCards,
        dealerCards: gameState.dealerCards,
        playerHandValue: gameState.playerHandValue,
        dealerHandValue: gameState.dealerHandValue,
        hash: gameState.hash,
        gameStatus: gameState.status,
    };
}

export const stand = async (
    gameState: any,
    handIndex: number = 0,
    splitMode: boolean = false
) => {
    const { remainingDeck, dealerCards, dealerHiddenCard } = gameState;
    if (remainingDeck.length === 0) {
        throw new Error("No cards left in the deck.");
    }

    const isLastHand = !splitMode || handIndex === 1;

    if (isLastHand) {
        if (dealerHiddenCard) {
            dealerCards.push(dealerHiddenCard);
            gameState.dealerHiddenCard = null;
        }
        gameState.dealerHandValue = calculateHandValue(dealerCards);

        while (gameState.dealerHandValue < 17) {
            const newCard = remainingDeck.pop();
            dealerCards.push(newCard);
            gameState.dealerHandValue = calculateHandValue(dealerCards);
        }
    }

    const playerHandValue = gameState.playerHandValue[handIndex];
    const playerBusted = playerHandValue > 21;
    const dealerBusted = gameState.dealerHandValue > 21;

    let handStatus = "stand";

    if (playerBusted) {
        handStatus = "bust";
    } else if (isLastHand) {
        if (dealerBusted) {
            handStatus = "dealer_bust";
        } else if (playerHandValue > gameState.dealerHandValue) {
            handStatus = "win";
        } else if (playerHandValue < gameState.dealerHandValue) {
            handStatus = "lose";
        } else {
            handStatus = "push";
        }
    }

    if (splitMode) {
        if (!Array.isArray(gameState.status)) {
            gameState.status = [];
        }
        gameState.status[handIndex] = handStatus;

        if (handIndex === 1 && gameState.status[0] === "stand") {
            const firstHandValue = gameState.playerHandValue[0];
            const firstHandBusted = firstHandValue > 21;

            if (firstHandBusted) {
                gameState.status[0] = "bust";
            } else if (dealerBusted) {
                gameState.status[0] = "dealer_bust";
            } else if (firstHandValue > gameState.dealerHandValue) {
                gameState.status[0] = "win";
            } else if (firstHandValue < gameState.dealerHandValue) {
                gameState.status[0] = "lose";
            } else {
                gameState.status[0] = "push";
            }
        }
    } else {
        gameState.status = handStatus;
    }

    await setObject(`${gameKey}:${gameState.id_user}`, {
        ...gameState,
        dealerCards,
        remainingDeck,
        status: gameState.status,
    });

    const currentStatus = Array.isArray(gameState.status)
        ? gameState.status[handIndex]
        : gameState.status;

    return {
        gameId: gameState.gameId,
        formattedPlayerCards: {
            firstHand: gameState.playerCards.firstHand.map((card: { value: string | number; }) => ({
                ...card,
                equal: valueMap[card.value as keyof typeof valueMap] || 0,
            })),
            secondHand: gameState.playerCards.secondHand.map((card: { value: string | number; }) => ({
                ...card,
                equal: valueMap[card.value as keyof typeof valueMap] || 0,
            })),
        },
        formattedDealerCards: dealerCards.map((card: { value: string | number; }) => ({
            ...card,
            equal: valueMap[card.value as keyof typeof valueMap] || 0,
        })),
        playerHandValue: gameState.playerHandValue,
        dealerHandValue: gameState.dealerHandValue,
        hash: gameState.hash,
        status: gameState.status,
        gameStatus: currentStatus,
    };
};


export const splitCards = async (gameState: any) => {
    const { playerCards, remainingDeck } = gameState;
    if (remainingDeck.length === 0) {
        throw new Error("No cards left in the deck.");
    }

    // Split the player's cards into two hands
    const firstHand = [playerCards?.firstHand[0], remainingDeck.pop()];
    const secondHand = [playerCards?.firstHand[1], remainingDeck.pop()];

    console.log("First hand:", firstHand);
    console.log("Second hand:", secondHand);

    const firstHandValue = calculateHandValue(firstHand);
    const secondHandValue = calculateHandValue(secondHand);

    await setObject(`${gameKey}:${gameState.id_user}`, {
        ...gameState,
        playerHandValue: [firstHandValue, secondHandValue],
        playerCards: {
            firstHand,
            secondHand,
        },
        remainingDeck,
    });

    return {
        gameId: gameState.gameId,
        formattedPlayerCards: {
            firstHand: firstHand.map(
                (card: { suit: string; value: keyof typeof valueMap }) => ({
                    ...card,
                    equal: valueMap[card.value] || 0,
                })
            ),
            secondHand: secondHand.map(
                (card: { suit: string; value: keyof typeof valueMap }) => ({
                    ...card,
                    equal: valueMap[card.value] || 0,
                })
            ),
        },
        formattedDealerCards: gameState.dealerCards.map(
            (card: { suit: string; value: keyof typeof valueMap }) => ({
                ...card,
                equal: valueMap[card.value] || 0,
            })
        ),
        playerHandValue: {
            firstHand: firstHandValue,
            secondHand: secondHandValue,
        },
        dealerHandValue: gameState.dealerHandValue,
        hash: gameState.hash,
        status: gameState.status,
    };
};

export const doubleDown = async (gameState: any, handIndex: number = 0, splitMode: boolean = false) => {
    const { remainingDeck, playerCards } = gameState;
    if (remainingDeck.length === 0) {
        throw new Error("No cards left in the deck.");
    }

    gameState.bet_amount *= 2;

    const hand =
        handIndex === 0
            ? gameState.playerCards.firstHand
            : gameState.playerCards.secondHand;

    const card = remainingDeck.pop();
    hand.push(card);

    gameState.playerHandValue[handIndex] = calculateHandValue(hand);

    if (gameState.playerHandValue[handIndex] > 21) {
        gameState.status = splitMode ? [...(gameState.status || []), "bust"] : "bust";
    } else if (splitMode && handIndex === 0) {
        /**  If in split mode and doubling the first hand, set status to "stand" for this hand  */
        if (!Array.isArray(gameState.status)) {
            gameState.status = [];
        }
        gameState.status[handIndex] = "stand";
    } else {
        const { dealerCards, dealerHiddenCard } = gameState;

        if (!splitMode || handIndex === 1) {
            if (dealerHiddenCard) {
                dealerCards.push(dealerHiddenCard);
                gameState.dealerHiddenCard = null;
            }
            gameState.dealerHandValue = calculateHandValue(dealerCards);

            while (gameState.dealerHandValue < 17) {
                const newCard = remainingDeck.pop();
                dealerCards.push(newCard);
                gameState.dealerHandValue = calculateHandValue(dealerCards);
            }
        }

        const playerHandValue = gameState.playerHandValue[handIndex];
        const dealerBusted = gameState.dealerHandValue > 21;

        let handStatus = "push";
        if (dealerBusted) {
            handStatus = "dealer_bust";
        } else if (playerHandValue > gameState.dealerHandValue) {
            handStatus = "win";
        } else if (playerHandValue < gameState.dealerHandValue) {
            handStatus = "lose";
        }

        if (splitMode) {
            if (!Array.isArray(gameState.status)) {
                gameState.status = [];
            }
            gameState.status[handIndex] = handStatus;

            if (handIndex === 1 && gameState.status[0] === "stand") {
                const firstHandValue = gameState.playerHandValue[0];
                const firstHandBusted = firstHandValue > 21;

                if (firstHandBusted) {
                    gameState.status[0] = "bust";
                } else if (dealerBusted) {
                    gameState.status[0] = "dealer_bust";
                } else if (firstHandValue > gameState.dealerHandValue) {
                    gameState.status[0] = "win";
                } else if (firstHandValue < gameState.dealerHandValue) {
                    gameState.status[0] = "lose";
                } else {
                    gameState.status[0] = "push";
                }
            }
        } else {
            gameState.status = handStatus;
        }
    }

    await setObject(`${gameKey}:${gameState.id_user}`, {
        ...gameState,
        playerCards,
        remainingDeck,
        status: gameState.status,
    });

    return {
        gameId: gameState.gameId,
        playerCards: {
            firstHand: gameState.playerCards.firstHand.map((card: { value: string | number }) => ({
                ...card,
                equal: valueMap[card.value as keyof typeof valueMap] || 0,
            })),
            secondHand: gameState.playerCards.secondHand.map((card: { value: string | number }) => ({
                ...card,
                equal: valueMap[card.value as keyof typeof valueMap] || 0,
            })),
        },
        dealerCards: gameState.dealerCards.map((card: { value: string | number }) => ({
            ...card,
            equal: valueMap[card.value as keyof typeof valueMap] || 0,
        })),
        dealerHandValue: gameState.dealerHandValue,
        playerHandValue: gameState.playerHandValue,
        hash: gameState.hash,
        gameStatus: gameState.status,
    };
};