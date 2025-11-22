import { Box } from "@mui/material";
import Card from "../Card";

export default function BlackjackGameInit() {
    return (
        <Box>
            <Box sx={{
                position: "absolute",
                top: "10%",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "10px"
            }}>
                <Card returned sx={{ zIndex: 1 }} />
                <Card returned sx={{ zIndex: 1 }} />
            </Box>

            <Box sx={{
                position: "absolute",
                bottom: "10%",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "10px"
            }}>
                <Card returned sx={{ zIndex: 1 }} />
                <Card returned sx={{ zIndex: 1 }} />
            </Box>
        </Box>
    )
}