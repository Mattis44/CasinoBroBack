import { Icon } from "@iconify/react";
import { Box, Button, InputBase, lighten, Paper, Typography } from "@mui/material";
import { useState } from "react";
import PropTypes from "prop-types";

const BettingInput = ({
    bet = 1,
    onChange
}) => {
    const [value, setValue] = useState(bet);

    return (
        <Box sx={{ mt: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 2 }}>
                <Typography variant="caption" sx={{ marginLeft: 2 }}>
                    Bet Amount
                </Typography>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Typography variant="caption">
                        125
                    </Typography>
                    <Icon icon="ph:coins" width="1.2rem" height="1.2rem" style={{ marginRight: 15 }} />
                </div>
            </div>
            <Paper component="form" sx={{ display: 'flex', alignItems: 'center', backgroundColor: (theme) => theme.palette.background.default, padding: 1, marginX: 2, marginTop: 1 }}>
                <InputBase
                    sx={{ ml: 1, flex: 1 }}
                    value={value}
                    onChange={(e) => {
                        const newValue = parseInt(e.target.value, 10);
                        if (!Number.isNaN(newValue)) {
                            setValue(newValue);
                            if (onChange) {
                                onChange(newValue);
                            }
                        } else {
                            setValue(0);
                        }
                    }}
                    endAdornment={<Icon icon="ph:coins" width="1.2rem" height="1.2rem" style={{ marginRight: 8 }} />}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Button
                        sx={{
                            backgroundColor: (theme) => theme.palette.background.paper,
                            "&:hover": {
                                backgroundColor: (theme) => lighten(theme.palette.background.paper, 0.2),
                            },
                            color: (theme) => theme.palette.text.primary,
                            width: '2rem',
                            height: '2rem',
                            fontSize: '0.7em',
                        }}
                        onClick={() => {
                            setValue(value / 2);
                            if (onChange) {
                                onChange(value / 2);
                            }
                        }}
                    >
                        1/2
                    </Button>
                    <Button
                        sx={{
                            backgroundColor: (theme) => theme.palette.background.paper,
                            "&:hover": {
                                backgroundColor: (theme) => lighten(theme.palette.background.paper, 0.2),
                            },
                            color: (theme) => theme.palette.text.primary,
                            width: '2rem',
                            height: '2rem',
                            fontSize: '0.7em',
                        }}
                        onClick={() => {
                            setValue(value * 2);
                            if (onChange) {
                                onChange(value * 2);
                            }
                        }}
                    >
                        2X
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

BettingInput.propTypes = {
    bet: PropTypes.number,
    onChange: PropTypes.func,
};

export default BettingInput;