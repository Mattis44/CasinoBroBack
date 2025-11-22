import { Icon } from "@iconify/react";
import { alpha, Button, Typography } from "@mui/material";
import PropTypes from "prop-types";

export default function ButtonBet({ icon, value, onClick, disabled }) {
    return (
        <Button
            variant="contained"
            onClick={onClick}
            sx={{
                width: '100%',
                height: '6vh',
                backgroundColor: alpha(icon.color, 0.2),
                "&:hover": {
                    backgroundColor: alpha(icon.color, 0.5),
                },
                color: (theme) => theme.palette.text.primary,
                display: 'flex',
                gap: 1,
            }}
            disabled={disabled}
        >
            <Typography>
                {value}
            </Typography>
            <Icon icon={icon.name} width="1.2rem" height="1.2rem" color={icon.color} />
        </Button>
    );
}

ButtonBet.propTypes = {
    icon: PropTypes.shape({
        name: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
    }).isRequired,
    value: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};