import { getObject, setObject } from "../../../redisClient";
import crypto from "crypto";

const gameKey = "blackjack:game:user";

const seededRandom = (seed: number) => {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
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
    "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K",
];

const valueMap = {
    "A": [1, 11],
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 10,
    "Q": 10,
    "K": 10,
};

const fullDeck = () => {
    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
};


const calculateHandValue = (cards: { suit: string; value: keyof typeof valueMap }[]) => {
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


export const initBlackjackGame = async (id_user: string, bet_amount: number) => {
    try {
        const gameId = crypto.randomUUID();
        let { shuffledDeck: deck, hash } = shuffleDeck(fullDeck());

        const playerCards = [deck.pop(), deck.pop()];
        const dealerCards = [deck.pop(), deck.pop()];

        const formatCard = (card: { suit: string; value: keyof typeof valueMap }) => ({
            ...card,
            equal: valueMap[card.value] || 0,
        });

        const formattedPlayerCards = playerCards.map(formatCard);
        const formattedDealerCards = dealerCards.map(formatCard);

        const playerHandValue = calculateHandValue(formattedPlayerCards);
        const dealerHandValue = calculateHandValue(formattedDealerCards[0] ? [formattedDealerCards[0]] : []);

        const gameState = {
            gameId,
            id_user,
            bet_amount,
            playerCards: formattedPlayerCards,
            dealerCards: formattedDealerCards,
            remainingDeck: deck,
            status: "in_progress",
            createdAt: new Date(),
            playerHandValue,
            dealerHandValue,
            hash,
        };

        await setObject(`${gameKey}:${id_user}`, gameState);

        return {
            gameId,
            formattedPlayerCards,
            formattedDealerCards,
            playerHandValue,
            dealerHandValue,
            hash,
        };
} catch (error) {
        console.error("Error initializing blackjack game:", error);
        throw error;
    }
};

export const retrieveGameState = async (gameId: string, id_user: string) => {
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