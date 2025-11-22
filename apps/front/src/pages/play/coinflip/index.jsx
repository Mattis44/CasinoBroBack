import { Box, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import CoinflipBetPanel from "src/components/casino/coinflip/BetPanel";
import { domAnimation, LazyMotion, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import Api from "src/utils/api";
import useSound from "src/hooks/useSound";

export default function CoinFlip() {
    const [flipping, setFlipping] = useState(false);
    const [finalSide, setFinalSide] = useState(null);
    const [wantedSide, setWantedSide] = useState(null);
    const [rotation, setRotation] = useState(0);
    const theme = useTheme();
    const winSound = useSound(`/fx/win.mp3`, 0.8);
    const loseSound = useSound(`/fx/lose.mp3`, 0.8);

    const handleFlip = async (side) => {
        if (flipping) return;
        setFlipping(true);
        setWantedSide(side);

        try {
            const result = await Api.post(`/coinflip/${side}`);
            const apiSide = result.side;

            const extraRotation = 3600;
            const targetRotation = apiSide === "heads" ? 0 : 180;
            const finalRotation = extraRotation + targetRotation;

            setRotation(0);

            setTimeout(() => {
                setFinalSide(apiSide);
                setRotation(finalRotation);
                setTimeout(() => {
                    setFlipping(false);
                    if (side === apiSide) {
                        winSound();
                    }
                    else {
                        loseSound();
                    }
                }
                    , 2050);
            }, 2050);

        } catch (error) {
            console.error("Erreur API coinflip:", error);
            setFlipping(false);
        }
    };

    useEffect(() => {
        console.log(`Coinflip final side: ${finalSide}`);
    }, [finalSide]);

    return (
        <Box sx={{
            height: '100%',
            width: '100%',
            border: `solid 4px ${theme.palette.background.paper}`,
            display: 'flex',
            borderRadius: "8px",
        }}>
            <CoinflipBetPanel bet={1} onBet={handleFlip} />
            <Box sx={{
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
            }}>
                <LazyMotion features={domAnimation}>
                    <Box
                        sx={{
                            width: 300,
                            height: 300,
                            perspective: 1000,
                        }}
                    >
                        <motion.div
                            animate={{
                                rotateY: rotation,
                            }}
                            transition={{
                                duration: 2,
                                ease: "easeInOut",
                            }}
                            style={{
                                width: 300,
                                height: 300,
                                position: 'relative',
                                transformStyle: 'preserve-3d',
                            }}
                        >
                            <motion.div
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.primary.main,
                                    border: '8px solid white',
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                <Icon icon="teenyicons:up-solid" width={150} height={150} color="#B7F2B7" />
                            </motion.div>

                            <motion.div
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    transform: 'rotateY(180deg)',
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.primary.main,
                                    border: '8px solid white',
                                    backfaceVisibility: 'hidden',
                                }}
                            >
                                <Icon icon="teenyicons:down-solid" width={150} height={150} color="#B7B1F2" />
                            </motion.div>
                        </motion.div>
                        {!flipping && finalSide !== null && (
                            <Box sx={{
                                marginTop: 4,
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: theme.palette.text.primary,
                                backgroundColor: theme.palette.background.paper,
                                padding: 1,
                                borderRadius: 5,
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                                    {finalSide === wantedSide ? "You Win!" : "You Lose!"}
                                </Typography>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 10,
                                }}>
                                    <Icon icon={finalSide === wantedSide ? "teenyicons:up-solid" : "teenyicons:down-solid"} width={25} height={25} color={finalSide === wantedSide ? "#B7F2B7" : "#B7B1F2"} />
                                    <Typography variant="body1" component="div" sx={{ fontWeight: 'bold' }}>
                                        {finalSide === "heads" ? "Heads" : "Tails"}
                                    </Typography>
                                </div>
                            </Box>
                        )}
                    </Box>
                </LazyMotion>
            </Box >
        </Box >
    );
}
