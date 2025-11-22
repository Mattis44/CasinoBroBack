import { Box, Typography } from "@mui/material";
import { useState } from "react";
import toast from "react-hot-toast";
import BlackjackGameInit from "src/components/casino/blackjack/GameInit";
import Ribbon from "src/components/casino/blackjack/Ribbon";
import Card from "src/components/casino/Card";
import useSound from "src/hooks/useSound";
import Api from "src/utils/api";

import BLACKJACK_CONSTANTS from "src/constants/BJ_CONSTS";
import { calculateHandValue } from "src/utils/blackjack";
import BlackjackBetPanel from "src/components/casino/blackjack/BetPanel";

export default function Blackjack() {
    const [bet, setBet] = useState(1);
    const [gameInfos, setGameInfos] = useState({
        gameId: null,
        hash: null,
    });

    const [playerCards, setPlayerCards] = useState([]);
    const [dealerCards, setDealerCards] = useState([]);
    const [playerHands, setPlayerHands] = useState([[]]);
    // -- Only used for special cases (split, double, etc.)
    const [activeHandIndex, setActiveHandIndex] = useState(0);
    const [playerHandValue, setPlayerHandValue] = useState([0]);
    const [splitMode, setSplitMode] = useState(false);
    const [isDouble, setIsDouble] = useState(false);
    // --
    const [dealerHandValue, setDealerHandValue] = useState(0);

    const [gameStarted, setGameStarted] = useState(false);
    const [dealingCard, setDealingCard] = useState(null); // { to: "player" | "dealer", index: number, card: { suit: "hearts" | "diamonds" | "clubs" | "spades", value: string } }
    const [isCardAnimating, setIsCardAnimating] = useState(false);
    const [gameState, setGameState] = useState(BLACKJACK_CONSTANTS.GAME_STATES.WAITING);
    const [insuranceDeclined, setInsuranceDeclined] = useState(false);

    const cardSound = useSound(`/fx/card1.wav`, 0.8);
    const winSound = useSound(`/fx/win.mp3`, 0.8);
    const loseSound = useSound(`/fx/lose.mp3`, 0.8);


    const dealCard = (to, card, index) => {
        setDealingCard({ to, card, index });
        setIsCardAnimating(true);
        cardSound();
        setTimeout(() => {
            if (to === "player") {
                setPlayerHands((prev) => {
                    const newHands = [...prev];
                    newHands[activeHandIndex] = [...newHands[activeHandIndex], card];
                    return newHands;
                });
            } else {
                setDealerCards((prev) => [...prev, card]);
            }
            setDealingCard(null);
            setIsCardAnimating(false);
        }, 600);
    };

    const resetGame = () => {
        setGameStarted(false);
        setPlayerCards([]);
        setDealerCards([]);
        setPlayerHands([[]]);
        setActiveHandIndex(0);
        setPlayerHandValue(0);
        setDealerHandValue(0);
        setGameInfos(null);
        setInsuranceDeclined(false);
        setSplitMode(false);
        setIsDouble(false);
    };
    const onBet = () => {
        if (bet < BLACKJACK_CONSTANTS.CONFIGS.MIN_BET_AMOUNT) {
            toast.error(`Minimum bet amount is ${BLACKJACK_CONSTANTS.CONFIGS.MIN_BET_AMOUNT}`);
            return;
        }
        if (bet > BLACKJACK_CONSTANTS.CONFIGS.MAX_BET_AMOUNT) {
            toast.error(`Maximum bet amount is ${BLACKJACK_CONSTANTS.CONFIGS.MAX_BET_AMOUNT}`);
            return;
        }
        if (gameState === BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) {
            toast.error("Game is already in progress. Please wait for the current game to finish.");
            return;
        }
        setGameState(BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS);

        resetGame();
        Api.post(`/blackjack/bet`, {
            bet_amount: bet,
        }).then((res) => {
            const {
                gameId: gId,
                playerCards: pcInit,
                dealerCards: dcInit,
                playerHandValue: phValue,
                dealerHandValue: dhValue,
                gameStatus: s,
                hash,
            } = res;

            if (res.status !== 200) {
                toast.error("An error occurred while placing the bet.");
                console.error(res);
                return;
            }

            setGameStarted(true);
            setGameInfos({
                gameId: gId,
                hash,
            });

            window.localStorage.setItem("blackjack:gid", gId);

            if (!gId || !pcInit || !dcInit) {
                toast.error("An error occurred while starting the game.");
                return;
            }

            setTimeout(() => dealCard("dealer", dcInit[0], 0), 0);
            setTimeout(() => dealCard("player", pcInit.firstHand[0], 0), 650);
            setTimeout(() => dealCard("dealer", dcInit[1], 1), 1300);
            setTimeout(() => dealCard("player", pcInit.firstHand[1], 1), 1950);

            setPlayerHandValue([phValue]);
            setDealerHandValue(dhValue);

            if (s === "blackjack") {
                toast.success("You won with a blackjack!");
                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WIN);
                winSound();
            }


            setPlayerCards({
                firstHand: pcInit.firstHand,
                secondHand: [],
            });

        }).catch((err) => {
            toast.error("An error occurred while placing the bet.");
            console.error(err);
        });
    };


    const onHit = () => {
        if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) {
            toast.error("Game is not in progress. Please place a bet first.");
            return;
        }

        Api.post(`/blackjack`, { action: "hit", handIndex: activeHandIndex })
            .then((res) => {
                if (res.status !== 200) {
                    toast.error("An error occurred while hitting.");
                    console.error(res);
                    return;
                }

                const {
                    playerCards: pc,
                    playerHandValue: phValue,
                    dealerCards: dc,
                    dealerHandValue: dhValue,
                    gameStatus: s
                } = res;

                const handKey = activeHandIndex === 0 ? "firstHand" : "secondHand";

                if (!pc || !pc[handKey] || pc[handKey].length === 0) {
                    toast.error("No player cards returned.");
                    return;
                }

                const lastCard = pc[handKey][pc[handKey].length - 1];
                dealCard("player", lastCard, activeHandIndex);

                setPlayerHandValue((prev) => {
                    const newHandValues = [...prev];
                    newHandValues[activeHandIndex] = phValue[activeHandIndex];
                    return newHandValues;
                });

                if (s === "bust") {
                    toast.error("You busted!");
                    setGameState(BLACKJACK_CONSTANTS.GAME_STATES.LOSE);
                    loseSound();

                    if (dc && dc.length > 1) {
                        const revealedDealerCards = dc.map((card, index) =>
                            index === 1 ? { ...card, hidden: false } : card
                        );
                        setDealerCards(revealedDealerCards);
                        setDealerHandValue(dhValue);
                    }
                } else if (s === "win") {
                    toast.success("You win!");
                    setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WIN);
                    winSound();
                } else if (s === "lose") {
                    toast.error("You lost!");
                    setGameState(BLACKJACK_CONSTANTS.GAME_STATES.LOSE);
                    loseSound();
                } else {
                    setGameState(BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS);
                }
            })
            .catch((err) => {
                toast.error("An error occurred while hitting.");
                console.error(err);
            });
    };



    const onStand = () => {
        if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) {
            toast.error("Game is not in progress. Please place a bet first.");
            return;
        }

        Api.post(`/blackjack`, { action: "stand", handIndex: activeHandIndex, splitMode })
            .then((res) => {
                if (res.status !== 200) {
                    toast.error("An error occurred while standing.");
                    console.error(res);
                    return;
                }

                const { dealerCards: dc, dealerHandValue: dhValue, gameStatus: s } = res;

                if (splitMode && activeHandIndex === 0) {
                    setActiveHandIndex(1);
                    return;
                }

                if (!dc || dc.length < 2) {
                    toast.error("Incomplete dealer cards received.");
                    return;
                }

                setDealerHandValue(dhValue);

                setDealerCards([
                    { ...dc[0], hidden: false },
                    { ...dc[1], hidden: false },
                ]);

                const additionalCards = dc.slice(2);
                additionalCards.forEach((card, index) => {
                    setTimeout(() => {
                        dealCard("dealer", card, index + 2);
                    }, index * 650 + 1650);
                });

                const endGame = () => {
                    if (splitMode) {
                        s.forEach((status, handIndex) => {
                            switch (status) {
                                case "win":
                                    toast.success(`Hand ${handIndex + 1}: You won!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.WIN;
                                        return newState;
                                    });
                                    winSound();
                                    break;
                                case "lose":
                                    toast.error(`Hand ${handIndex + 1}: You lost!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.LOSE;
                                        return newState;
                                    });
                                    loseSound();
                                    break;
                                case "push":
                                    toast(`Hand ${handIndex + 1}: It's a push!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.WAITING;
                                        return newState;
                                    });
                                    break;
                                case "dealer_bust":
                                    toast.success(`Hand ${handIndex + 1}: Dealer busted! You win!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.WIN;
                                        return newState;
                                    });
                                    winSound();
                                    break;
                                default:
                                    toast.error(`Hand ${handIndex + 1}: Unexpected game status.`);
                                    console.error(`Hand ${handIndex + 1}: Unexpected game status:`, status);
                                    break;
                            }
                        });
                    } else {
                        switch (s) {
                            case "win":
                                toast.success("You won!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WIN);
                                winSound();
                                break;
                            case "lose":
                                toast.error("You lost!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.LOSE);
                                loseSound();
                                break;
                            case "push":
                                toast("It's a push!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WAITING);
                                break;
                            case "dealer_bust":
                                toast.success("Dealer busted! You win!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WIN);
                                winSound();
                                break;
                            default:
                                toast.error("Unexpected game status.");
                                console.error("Unexpected game status:", s);
                                break;
                        }
                    }
                };

                const totalAnimationTime = additionalCards.length > 0
                    ? additionalCards.length * 650 + 1650
                    : 0;

                setTimeout(endGame, totalAnimationTime);
            })
            .catch((err) => {
                toast.error("An error occurred while standing.");
                console.error(err);
            });
    };


    const onSplit = () => {
        if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) {
            toast.error("Game is not in progress. Please place a bet first.");
            return;
        }

        if (playerHands[0].length < 2) {
            toast.error("You need at least 2 cards to split.");
            return;
        }
        if (playerHands[0][0].value !== playerHands[0][1].value) {
            toast.error("You can only split cards of the same value.");
            return;
        }

        Api.post(`/blackjack`, { action: "split" })
            .then((res) => {
                if (res.status !== 200) {
                    toast.error("An error occurred while splitting.");
                    return;
                }

                const { playerCards: pc, playerHandValue: phValue } = res;
                if (!pc?.firstHand || !pc?.secondHand) {
                    toast.error("Invalid split response.");
                    return;
                }

                setPlayerHands([pc.firstHand, pc.secondHand]);
                setActiveHandIndex(0);
                setSplitMode(true);
                setPlayerHandValue([
                    phValue.firstHand,
                    phValue.secondHand,
                ]);
            })
            .catch((err) => {
                toast.error("An error occurred while splitting.");
                console.error(err);
            });
    };

    const onDouble = () => {
        setIsDouble(true);
        if (gameState !== BLACKJACK_CONSTANTS.GAME_STATES.IN_PROGRESS) {
            toast.error("Game is not in progress. Please place a bet first.");
            return;
        }
        if (playerHands[activeHandIndex].length !== 2) {
            toast.error("You can only double down on the first two cards.");
            return;
        }
        if (bet * 2 > BLACKJACK_CONSTANTS.CONFIGS.MAX_BET_AMOUNT) {
            toast.error(`Maximum bet amount is ${BLACKJACK_CONSTANTS.CONFIGS.MAX_BET_AMOUNT}`);
            return;
        }
        if (bet * 2 < BLACKJACK_CONSTANTS.CONFIGS.MIN_BET_AMOUNT) {
            toast.error(`Minimum bet amount is ${BLACKJACK_CONSTANTS.CONFIGS.MIN_BET_AMOUNT}`);
            return;
        }

        Api.post(`/blackjack`, { action: "double", handIndex: activeHandIndex, splitMode })
            .then((res) => {
                if (res.status !== 200) {
                    toast.error("An error occurred while doubling down.");
                    console.error(res);
                    return;
                }

                const { playerCards: pc, playerHandValue: phValue, dealerCards: dc, dealerHandValue: dhValue, gameStatus: s } = res;

                if (!pc || !pc.firstHand) {
                    toast.error("No player cards returned.");
                    return;
                }

                let currentHandCards;
                if (splitMode) {
                    currentHandCards = activeHandIndex === 0 ? pc.firstHand : pc.secondHand;
                } else {
                    currentHandCards = pc.firstHand;
                }

                if (!currentHandCards || currentHandCards.length === 0) {
                    toast.error("No cards found for current hand.");
                    return;
                }

                const lastCard = currentHandCards[currentHandCards.length - 1];
                dealCard("player", lastCard, activeHandIndex);

                setPlayerHandValue((prev) => {
                    const newHandValues = [...prev];
                    newHandValues[activeHandIndex] = phValue[activeHandIndex];
                    return newHandValues;
                });

                if (splitMode && activeHandIndex === 0) {
                    setActiveHandIndex(1);
                    return;
                }

                if (!dc || dc.length < 2) {
                    toast.error("Incomplete dealer cards received.");
                    return;
                }

                setDealerHandValue(dhValue);

                setDealerCards([
                    { ...dc[0], hidden: false },
                    { ...dc[1], hidden: false },
                ]);

                const additionalCards = dc.slice(2);
                additionalCards.forEach((card, index) => {
                    setTimeout(() => {
                        dealCard("dealer", card, index + 2);
                    }, index * 650 + 1650);
                });

                const endGame = () => {
                    if (splitMode) {
                        s.forEach((status, handIndex) => {
                            switch (status) {
                                case "win":
                                    toast.success(`Hand ${handIndex + 1}: You won!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.WIN;
                                        return newState;
                                    });
                                    winSound();
                                    break;
                                case "lose":
                                    toast.error(`Hand ${handIndex + 1}: You lost!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.LOSE;
                                        return newState;
                                    });
                                    loseSound();
                                    break;
                                case "push":
                                    toast(`Hand ${handIndex + 1}: It's a push!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.WAITING;
                                        return newState;
                                    });
                                    break;
                                case "dealer_bust":
                                    toast.success(`Hand ${handIndex + 1}: Dealer busted! You win!`);
                                    setGameState((prev) => {
                                        const newState = [...prev];
                                        newState[handIndex] = BLACKJACK_CONSTANTS.GAME_STATES.WIN;
                                        return newState;
                                    });
                                    winSound();
                                    break;
                                default:
                                    toast.error(`Hand ${handIndex + 1}: Unexpected game status.`);
                                    console.error(`Hand ${handIndex + 1}: Unexpected game status:`, status);
                                    break;
                            }
                        });
                    } else {
                        switch (s) {
                            case "win":
                                toast.success("You win!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WIN);
                                winSound();
                                break;
                            case "lose":
                                toast.error("You lost!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.LOSE);
                                loseSound();
                                break;
                            case "push":
                                toast("It's a push!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WAITING);
                                break;
                            case "dealer_bust":
                                toast.success("Dealer busted! You win!");
                                setGameState(BLACKJACK_CONSTANTS.GAME_STATES.WIN);
                                winSound();
                                break;
                            default:
                                toast.error("Unexpected game status.");
                                console.error("Unexpected game status:", s);
                                break;
                        }
                    }
                };

                const totalAnimationTime = additionalCards.length > 0
                    ? additionalCards.length * 650 + 1650
                    : 0;

                setTimeout(endGame, totalAnimationTime);
            })
            .catch((err) => {
                toast.error("An error occurred while doubling down.");
                console.error(err);
            });
    };




    const renderGame = () => {
        if (!gameStarted) {
            return <BlackjackGameInit />;
        }
        return (
            <>
                {BLACKJACK_CONSTANTS.FUNCS.IS_INSURANCE(gameState, dealerCards, dealerHandValue) && !insuranceDeclined && (
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            backgroundColor: (theme) => theme.palette.background.paper,
                            padding: 3,
                            borderRadius: "8px",
                            boxShadow: (theme) => `0px 4px 10px ${theme.palette.grey[800]}`,
                            zIndex: 100,
                        }}
                    >
                        <Typography variant="h6" sx={{ marginBottom: 2 }}>
                            Do you want to take insurance?
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                            <Box
                                onClick={() => {
                                    setInsuranceDeclined(true);
                                }}
                                sx={{
                                    padding: 1,
                                    backgroundColor: "green",
                                    color: "white",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    textAlign: "center",
                                }}
                            >
                                Yes
                            </Box>
                            <Box
                                onClick={() => {
                                    setInsuranceDeclined(true);
                                }}
                                sx={{
                                    padding: 1,
                                    backgroundColor: "red",
                                    color: "white",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    textAlign: "center",
                                }}
                            >
                                No
                            </Box>
                        </Box>
                    </Box>
                )}
                {dealingCard && isCardAnimating && (
                    <Card
                        returned={dealingCard?.card?.hidden}
                        sx={{
                            position: "absolute",
                            top: 20,
                            left: 20,
                            zIndex: 99,
                            animation: `fly-to-${dealingCard.to}-${dealingCard.index} 400ms ease-out forwards`,
                        }}
                        suit={dealingCard.card.suit}
                        value={dealingCard.card.value}
                    />
                )}
                <Box sx={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)" }}>
                    <Box
                        sx={{
                            display: "flex",
                            color: "white",
                            fontWeight: "bold",
                            marginBottom: "5px",
                            fontSize: "20px",
                            borderRadius: "16px",
                            backgroundColor: (theme) => theme.palette.background.paper,
                            justifyContent: "center",
                            alignItems: "center",
                            width: "40px",
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{
                                justifyContent: "center",
                            }}
                        >
                            {dealerHandValue}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: "10px" }}>
                        {dealerCards.length === 0 ? (
                            <Card fakeCard returned />
                        ) : (
                            dealerCards.map((card, i) => (
                                <Card key={`dealer-${i}`} returned={card.hidden} suit={card.suit} value={card.value} />
                            ))
                        )}
                    </Box>
                </Box>

                <Box sx={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)" }}>
                    {!splitMode ? (
                        // Mode normal : 1 seule main
                        <Box
                            sx={{
                                display: "flex",
                                color: "white",
                                fontWeight: "bold",
                                marginBottom: "5px",
                                fontSize: "20px",
                                borderRadius: "16px",
                                backgroundColor: (theme) => {
                                    if (gameState === "win") {
                                        return "green";
                                    } if (gameState === "lose") {
                                        return "red";
                                    }
                                    return theme.palette.background.paper;
                                },
                                justifyContent: "center",
                                alignItems: "center",
                                width: "40px",
                            }}
                        >
                            <Typography variant="h6">
                                {calculateHandValue(playerHands[activeHandIndex])}
                            </Typography>
                        </Box>
                    ) : (
                        // Mode split : 1 value par main
                        <Box sx={{ display: "flex", gap: "10px", marginBottom: "10px", justifyContent: "center" }}>
                            {playerHands.map((hand, handIndex) => (
                                <Box
                                    key={`hand-value-${handIndex}`}
                                    sx={{
                                        color: "white",
                                        fontWeight: "bold",
                                        fontSize: "20px",
                                        borderRadius: "16px",
                                        backgroundColor: (theme) => {
                                            if (gameState === "win") return "green";
                                            if (gameState === "lose") return "red";
                                            return theme.palette.background.paper;
                                        },
                                        width: "40px",
                                        height: "40px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: handIndex === activeHandIndex ? "2px solid yellow" : "none",
                                    }}
                                >
                                    <Typography variant="h6">
                                        {calculateHandValue(hand)}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    <Box sx={{ display: "flex", gap: "10px" }}>
                        {playerHands.map((hand, handIndex) => (
                            <Box
                                key={`hand-${handIndex}`}
                                sx={{
                                    display: "flex",
                                    gap: "10px",
                                    border: splitMode && handIndex === activeHandIndex ? "2px solid yellow" : "none",
                                    padding: "5px",
                                    borderRadius: "8px",
                                    cursor: splitMode ? "pointer" : "default",
                                }}
                                onClick={() => splitMode && setActiveHandIndex(handIndex)}
                            >
                                {hand.map((card, i) => (
                                    <Card
                                        key={`player-${handIndex}-${i}`}
                                        returned={card.hidden}
                                        suit={card.suit}
                                        value={card.value}
                                    />
                                ))}
                            </Box>
                        ))}
                    </Box>
                </Box>

            </>
        );
    }
    return (
        <Box sx={{
            height: '100%',
            width: '100%',
            border: (theme) => `solid 4px ${theme.palette.background.paper}`,
            display: 'flex',
            borderRadius: "8px",
        }}>
            <BlackjackBetPanel
                bet={bet}
                onHit={onHit}
                onBet={onBet}
                onStand={onStand}
                onSplit={onSplit}
                onDouble={onDouble}
                splitMode={splitMode}
                isDouble={isDouble}
                onBetAmountChange={(value) => setBet(value)}
                playerCards={playerCards}
                dealerCards={dealerCards}
                playerHands={playerHands}
                activeHandIndex={activeHandIndex}
                gameState={gameState}
                infos={gameInfos}
                playerHandValue={playerHandValue}
            />
            <Box
                sx={{
                    padding: 3,
                    position: "relative",
                    flex: 1
                }}>
                <Box sx={{ position: "relative", height: "150px", width: "100px" }}>
                    <Card returned sx={{ position: "absolute", top: 0, left: 0 }} />
                    <Card returned sx={{ position: "absolute", top: "20px", left: "10px" }} />
                </Box>
                <Ribbon />
                {renderGame()}
            </Box>
        </Box>
    );
}