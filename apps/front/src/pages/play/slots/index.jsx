import { Box } from "@mui/material";
import SlotsBetPanel from "src/components/slots/BetPanel";
import Slot from "src/components/slots/Slot";

export default function Slots() {
    return (
        <Box sx={{
            height: '100%',
            width: '100%',
            border: (theme) => `solid 4px ${theme.palette.background.paper}`,
            display: 'flex',
            borderRadius: "8px",
        }}>
            <SlotsBetPanel />
            <Slot />
        </Box>
    )
}