import { Icon } from "@iconify/react";
import { Box, Button, Divider, Grid, Tooltip, Typography } from "@mui/material";
import PropTypes from "prop-types";
import BLACKJACK_CONSTANTS from "src/constants/BJ_CONSTS";
import BettingInput from "../BettingInput";
import ButtonBet from "../ButtonBet";

export default function BlackjackBetPanel({
    bet,
    onBet,
    onHit,
    onStand,
    onSplit,
    onDouble,
    onBetAmountChange,
    dealerCards,
    playerHands,
    activeHandIndex,
    gameState,
    playerHandValue,
    splitMode,
    isDouble,
    infos = {},
}) {

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
            <Box sx={{ width: '100%' }}>
                <BettingInput
                    onChange={(value) => {
                        if (onBetAmountChange) {
                            onBetAmountChange(value);
                        }
                    }}
                    bet={bet}
                />
                <Divider sx={{ width: '100%', marginTop: 2 }} />
                <Grid container spacing={1} sx={{ padding: 2 }}>
                    <Grid item xs={6}>
                        <ButtonBet
                            value="Hit"
                            onClick={() => {
                                if (onHit) {
                                    onHit();
                                }
                            }}
                            icon={{ name: "fluent:slide-add-28-filled", color: "#B7B1F2" }}
                            disabled={!BLACKJACK_CONSTANTS.FUNCS.CAN_HIT(gameState, playerHands, activeHandIndex, dealerCards, playerHandValue, isDouble)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <ButtonBet
                            value="Stand"
                            onClick={() => {
                                if (onStand) {
                                    onStand();
                                }
                            }}
                            disabled={!BLACKJACK_CONSTANTS.FUNCS.CAN_STAND(gameState, playerHands, activeHandIndex, dealerCards, isDouble)}
                            icon={{ name: "mingcute:hand-fill", color: "#FBF3B9" }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <ButtonBet
                            value="Split"
                            onClick={() => {
                                if (onSplit) {
                                    onSplit();
                                }
                            }}
                            disabled={!BLACKJACK_CONSTANTS.FUNCS.CAN_SPLIT(gameState, playerHands, activeHandIndex, dealerCards, splitMode, isDouble)}
                            icon={{ name: "fluent:split-vertical-12-filled", color: "#F2B7B7" }}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <ButtonBet
                            value="Double"
                            onClick={() => {
                                if (onDouble) {
                                    onDouble();
                                }
                            }}
                            disabled={!BLACKJACK_CONSTANTS.FUNCS.CAN_DOUBLE(gameState, playerHands, activeHandIndex, dealerCards, isDouble)}
                            icon={{ name: "healthicons:coins", color: "#B7F2B7" }}
                        />
                    </Grid>
                    <Button
                        variant="contained"
                        sx={{
                            width: '100%',
                            height: '6vh',
                            backgroundColor: "green",
                            "&:hover": {
                                backgroundColor: "#4CAF50"
                            },
                            color: (theme) => theme.palette.text.primary,
                            display: 'flex',
                            marginTop: 2,
                            ml: 1
                        }}
                        onClick={() => {
                            if (onBet) {
                                onBet();
                            }
                        }}
                    >
                        Bet
                    </Button>
                </Grid>
            </Box>
            {infos && infos.gameId && infos.hash && (
                <Box sx={{
                    display: "flex",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 2,
                    padding: 2,
                    border: "1px solid",
                    borderColor: (theme) => theme.palette.divider,
                    margin: 2,
                    alignItems: "center",
                    borderRadius: 2,
                    position: "relative",
                }}>
                    <Tooltip title="GID is the Game ID, a unique identifier for the game session. HASH is a cryptographic hash that ensures the integrity and the proof of equity of the game data.">
                        <Icon
                            icon="mdi:information-outline"
                            width="1rem"
                            height="1rem"
                            style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                color: "gray",
                            }}
                        />
                    </Tooltip>
                    <Box sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                    }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
                                GID
                            </Typography>
                            <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary, wordBreak: "break-word", textAlign: "center" }}>
                                {infos?.gameId}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "center",
                    }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{
                                display: "flex",
                                gap: 2,
                            }}>
                                <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
                                    HASH
                                </Typography>
                            </div>
                            <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary, wordBreak: "break-word", textAlign: "center" }}>
                                {infos?.hash}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    )
}



BlackjackBetPanel.propTypes = {
    bet: PropTypes.number.isRequired,
    onBet: PropTypes.func,
    onHit: PropTypes.func,
    onStand: PropTypes.func,
    onSplit: PropTypes.func,
    onDouble: PropTypes.func,
    onBetAmountChange: PropTypes.func,
    dealerCards: PropTypes.arrayOf(PropTypes.shape({
        suit: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        hidden: PropTypes.bool,
    })).isRequired,
    playerHands: PropTypes.arrayOf(PropTypes.shape({
        cards: PropTypes.arrayOf(PropTypes.shape({
            suit: PropTypes.string.isRequired,
            value: PropTypes.string.isRequired,
            hidden: PropTypes.bool,
        })).isRequired,
        bet: PropTypes.number.isRequired,
    })).isRequired,
    activeHandIndex: PropTypes.number.isRequired,
    gameState: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string)
    ]).isRequired,
    infos: PropTypes.shape({
        gameId: PropTypes.string.isRequired,
        hash: PropTypes.string.isRequired,
    }),
    playerHandValue: PropTypes.number.isRequired,
    splitMode: PropTypes.bool.isRequired,
    isDouble: PropTypes.bool.isRequired,
};

ButtonBet.propTypes = {
    icon: PropTypes.object.isRequired,
    value: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};