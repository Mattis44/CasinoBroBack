
const BLACKJACK_CONSTANTS = {
    INSURANCE_EQUAL: 11,
    CONFIGS: {
        MIN_BET_AMOUNT: 1,
        MAX_BET_AMOUNT: 10000,
    },
    GAME_STATES: {
        WAITING: "waiting",
        IN_PROGRESS: "in_progress",
        WIN: "win",
        LOSE: "lose",
    },
    FUNCS: {
        CAN_HIT: (gameState, playerHands, currentHandIndex, dealerCards, handValue, isDouble) => {
            if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) return false;
            if (!dealerCards || dealerCards.length === 0) return false;

            const currentHand = playerHands?.[currentHandIndex];
            if (!currentHand) return false;
            if (isDouble) return false;

            return Array.isArray(handValue) ? handValue.every(value => value < 21) : handValue < 21;
        },

        CAN_STAND: (gameState, playerHands, currentHandIndex, dealerCards, isDouble) => {
            if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) return false;
            if (!dealerCards || dealerCards.length === 0) return false;

            const currentHand = playerHands?.[currentHandIndex];
            if (!currentHand) return false;
            if (isDouble) return false;
            return currentHand && currentHand.length > 0;
        },

        CAN_DOUBLE: (gameState, playerHands, currentHandIndex, dealerCards, isDouble) => {
            if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) return false;
            if (!dealerCards || dealerCards.length === 0) return false;

            const currentHand = playerHands?.[currentHandIndex];
            if (!currentHand || currentHand.length === 0) return false;
            if (isDouble) return false;
            return currentHand && currentHand.length === 2;
        },

        CAN_SPLIT: (gameState, playerHands, currentHandIndex, dealerCards, splitMode, isDouble) => {
            if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) return false;
            if (!dealerCards || dealerCards.length === 0) return false;

            const currentHand = playerHands?.[currentHandIndex];
            if (!currentHand || currentHand.length !== 2) return false;

            if (splitMode) return false;
            if (isDouble) return false;
            return currentHand[0].value === currentHand[1].value;
        },

        IS_INSURANCE: (gameState, dealerCards, dealerHandValue) => gameState === BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS
            && dealerCards.length === 2
            && dealerHandValue === BLACKJACK_CONSTANTS.INSURANCE_EQUAL
    }
}

export default BLACKJACK_CONSTANTS;