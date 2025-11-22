import { Box, Divider } from "@mui/material";
import BettingInput from "../BettingInput";
import ButtonBet from "../ButtonBet";
import PropTypes from "prop-types";

export default function CoinflipBetPanel({
    bet,
    onBet,
}) {
    const handleBet = (value) => {
        if (onBet) {
            onBet(value);
        }
    }
    return (
        <Box sx={{
            width: 350,
            height: '100%',
            backgroundColor: (theme) => theme.palette.background.paper,
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            <Box sx={{
                width: '100%',
            }}>
                <BettingInput bet={bet} />
                <Divider sx={{ width: '100%', marginTop: 2 }} />
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    padding: 2,
                }}>
                    <ButtonBet value="Heads"
                        icon={{ name: "teenyicons:up-solid", color: "#B7F2B7" }}
                        onClick={() => handleBet("heads")}
                    />
                    <ButtonBet value="Tails"
                        icon={{ name: "teenyicons:down-solid", color: "#B7B1F2" }}
                        onClick={() => handleBet("tails")}
                    />
                </Box>
            </Box>
        </Box>
    )
}

CoinflipBetPanel.propTypes = {
    bet: PropTypes.number,
    onBet: PropTypes.func,
};