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
            equal: valueMap[card.value] || 0,
        });

        const formattedPlayerCards = playerCards.map(formatCard);
        const formattedDealerCards = dealerCards.map(formatCard);

        const playerHandValue = calculateHandValue(formattedPlayerCards);
        const dealerHandValue = calculateHandValue(
            formattedDealerCards[0] ? [formattedDealerCards[0]] : []
        );
        let status = "in_progress";

        const gameState = {
            gameId,
            id_user,
            bet_amount,
            playerCards: formattedPlayerCards,
            dealerCards: formattedDealerCards,
            remainingDeck: deck,
            status,
            createdAt: new Date(),
            playerHandValue,
            dealerHandValue,
            dealerHiddenCard,
            hash,
        };
        if (playerHandValue === 21) {
            status = "blackjack";
            // Add logic to handle blackjack win
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

export const hitCard = async (gameState: any) => {
    const { remainingDeck, playerCards } = gameState;
    if (remainingDeck.length === 0) {
        throw new Error("No cards left in the deck.");
    }

    const newCard = remainingDeck.pop();
    playerCards.push(newCard);

    const newPlayerHandValue = calculateHandValue(playerCards);
    await setObject(`${gameKey}:${gameState.id_user}`, {
        ...gameState,
        playerCards,
        remainingDeck,
        playerHandValue: newPlayerHandValue,
    });

    const busted = newPlayerHandValue > 21;
    let status = gameState.status;
    if (busted) {
        status = "bust";
        // Add logic to handle bust
    } else if (newPlayerHandValue === 21) {
        status = "blackjack";
        // Add logic to handle blackjack win
    }

    return {
        gameId: gameState.gameId,
        formattedPlayerCards: playerCards.map(
            (card: { suit: string; value: keyof typeof valueMap }) => ({
                ...card,
                equal: valueMap[card.value] || 0,
            })
        ),
        formattedDealerCards: gameState.dealerCards.map(
            (card: { suit: string; value: keyof typeof valueMap }) => ({
                ...card,
                equal: valueMap[card.value] || 0,
            })
        ),
        playerHandValue: newPlayerHandValue,
        dealerHandValue: gameState.dealerHandValue,
        hash: gameState.hash,
        status,
    };
};

export const stand = async (gameState: any) => {
    const { remainingDeck, dealerCards, dealerHiddenCard } = gameState;
    if (remainingDeck.length === 0) {
        throw new Error("No cards left in the deck.");
    }

    // Add the dealer's hidden card to their hand
    dealerCards.push(dealerHiddenCard);
    gameState.dealerHandValue = calculateHandValue(dealerCards);

    // Dealer draws cards until their hand value is at least 17
    while (gameState.dealerHandValue < 17) {
        const newCard = remainingDeck.pop();
        dealerCards.push(newCard);
        gameState.dealerHandValue = calculateHandValue(dealerCards);
    }

    const playerBusted = gameState.playerHandValue > 21;
    const dealerBusted = gameState.dealerHandValue > 21;

    let status = "stand";
    if (playerBusted) {
        status = "bust";
        // Add logic to handle bust
    } else if (dealerBusted) {
        status = "dealer_bust";
        // Add logic to handle dealer bust
    } else if (gameState.playerHandValue > gameState.dealerHandValue) {
        status = "win";
        // Add logic to handle win
    } else if (gameState.playerHandValue < gameState.dealerHandValue) {
        status = "lose";
        // Add logic to handle lose
    } else {
        status = "push";
        // Add logic to handle push
    }

    await setObject(`${gameKey}:${gameState.id_user}`, {
        ...gameState,
        dealerCards,
        remainingDeck,
        status,
    });

    return {
        gameId: gameState.gameId,
        formattedPlayerCards: gameState.playerCards.map(
            (card: { suit: string; value: keyof typeof valueMap }) => ({
                ...card,
                equal: valueMap[card.value] || 0,
            })
        ),
        formattedDealerCards: dealerCards.map(
            (card: { suit: string; value: keyof typeof valueMap }) => ({
                ...card,
                equal: valueMap[card.value] || 0,
            })
        ),
        playerHandValue: gameState.playerHandValue,
        dealerHandValue: gameState.dealerHandValue,
        hash: gameState.hash,
        status,
    };
};

export const splitCards = async (gameState: any) => {
    const { playerCards, remainingDeck } = gameState;
    if (remainingDeck.length === 0) {
        throw new Error("No cards left in the deck.");
    }

    // Split the player's cards into two hands
    const firstHand = [playerCards[0], remainingDeck.pop()];
    const secondHand = [playerCards[1], remainingDeck.pop()];

    // Calculate the hand values for both hands
    const firstHandValue = calculateHandValue(firstHand);
    const secondHandValue = calculateHandValue(secondHand);

    await setObject(`${gameKey}:${gameState.id_user}`, {
        ...gameState,
        playerCards: {
            firstHand,
            secondHand,
        },
        remainingDeck,
        firstHandValue,
        secondHandValue,
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
}