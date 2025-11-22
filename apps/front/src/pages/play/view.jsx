import { Box, Card, Divider, Typography } from "@mui/material";
import { useNavigate } from "react-router";

export default function Play() {
    const navigate = useNavigate()
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Featured
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                <Card
                    sx={{
                        width: 400,
                        height: 200,
                        backgroundImage: "url('/assets/illustrations/bj_card.png')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        color: "white",
                        p: 2,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        filter: "drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.5))",
                        position: "relative",
                        cursor: "pointer",
                        transform: "scale(1.0)",
                        transition: "transform 0.3s ease-in-out",
                        "&:hover": {
                            transform: "scale(1.02)",
                        },
                    }}
                    onClick={() => {
                        navigate("/app/blackjack")
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1,
                        }}
                    />
                    <Typography
                        variant="h5"
                        gutterBottom
                        sx={{ position: "relative", zIndex: 2 }}
                    >
                        Blackjack
                    </Typography>
                </Card>
            </Box>
        </Box>
    )
}