import { Box, darken } from "@mui/material";
import PropTypes from "prop-types";
import { useMemo } from "react";

/**
 * 
 * @param {"hearts" | "diamonds" | "clubs" | "spades"} suit
 * @param {"A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"} rank
 * @param {number} width
 * @param {number} height
 * @param {boolean} returned - true = dos, false = face
 * @param {object} sx - styles to be applied to the card
 * @returns {JSX.Element}
 */
export default function Card({
    suit,
    value,
    width = 100,
    height = 150,
    returned = false,
    sx = {},
    fakeCard = false,
}) {
    const getColorForSuit = (suitType) =>
        suitType === "hearts" || suitType === "diamonds" ? "red" : "black";

    const getIconForSuit = (suitType) => {
        switch (suitType) {
            case "hearts": return "♥";
            case "diamonds": return "♦";
            case "clubs": return "♣";
            case "spades": return "♠";
            default: return "?";
        }
    };

    const cardSize = useMemo(() => ({
        width,
        height,
    }), [width, height]);

    return (
        <Box sx={{
            perspective: "1000px",
            pointerEvents: "none",
            ...cardSize,
            ...sx,
            opacity: fakeCard ? 0 : 1,
        }}>
            <Box
                className={`card-inner ${returned ? "" : "flipped"}`}
                sx={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.6s",
                    transform: returned ? "rotateY(0deg)" : "rotateY(180deg)",
                }}
            >
                <Box
                    className="card-back"
                    sx={{
                        ...cardSize,
                        position: "absolute",
                        backfaceVisibility: "hidden",
                        border: (theme) => `solid 3px ${theme.palette.common.white}`,
                        borderRadius: "8px",
                        background: (theme) => `repeating-linear-gradient(
                            45deg,
                            rgb(0, 0, 0),
                            rgb(0, 0, 0) 10px,
                            ${darken(theme.palette.primary.main, 0.4)} 10px,
                            ${darken(theme.palette.primary.main, 0.4)} 20px
                        )`,
                    }}
                />

                <Box
                    className="card-front"
                    sx={{
                        ...cardSize,
                        position: "absolute",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        border: (theme) => `solid 1px ${theme.palette.common.white}`,
                        borderRadius: "8px",
                        padding: 3,
                        backgroundColor: (theme) => theme.palette.common.white,
                        color: (theme) => theme.palette.common.black,
                        fontSize: "2rem",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",

                    }}
                >
                    <Box sx={{
                        position: "absolute",
                        top: 5,
                        left: 20,
                        fontSize: "2rem",
                        fontWeight: "bold",
                        color: getColorForSuit(suit),
                    }}>
                        {value || "?"}
                    </Box>
                    <Box sx={{
                        position: "absolute",
                        top: 30,
                        left: 15,
                        fontSize: "4rem",
                        fontWeight: "bold",
                        color: getColorForSuit(suit),
                    }}>
                        {getIconForSuit(suit)}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

Card.propTypes = {
    suit: PropTypes.string,
    value: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    returned: PropTypes.bool,
    sx: PropTypes.object,
    fakeCard: PropTypes.bool,
};
