import { Box, Typography } from "@mui/material";

export default function Ribbon() {
    return (
        <Box
            sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
                width: "auto",
            }}
        >
            <Box
                className="ribbon"
            >
                <Typography
                    variant="h4"
                    sx={{
                        mx: 3,
                    }}
                    color="gray"
                >
                    Blackjack pays 3 to 2
                </Typography>
            </Box>
            <Typography
                variant="subtitle1"
                color="gray"
            >
                Insurance pays 2 to 1
            </Typography>
        </Box>
    )
}