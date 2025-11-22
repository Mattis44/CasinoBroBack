import { useTheme } from "@mui/material";
import PropTypes from "prop-types";
import { Mention, MentionsInput } from "react-mentions";

export default function MessageInput({
    inputValue,
    setInputValue,
    sendMessage,
    chat = [],
    onlineUsers = [],
}) {
    const theme = useTheme();
    const mentionUsers = Array.from(
        new Map(
            onlineUsers
                .filter((u) => u.user?.username)
                .map((u) => [u.id_user, { id: u.id_user, display: u.user.username }])
        ).values()
    );

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (inputValue.trim()) {
                sendMessage(inputValue.trim());
                setInputValue('');
            }
        }
    };
    return (
        <div style={{ width: '100%' }}>
            <MentionsInput
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Hey @mention !"
                onKeyDown={handleKeyDown}
                style={{
                    control: {
                        backgroundColor: 'transparent',
                        fontSize: 16,
                        fontWeight: 'normal',
                    },
                    highlighter: {
                        padding: 5,
                        backgroundColor: 'transparent',
                        color: "transparent",
                    },
                    input: {
                        padding: 5,
                        minHeight: 40,
                        borderRadius: 4,
                        border: `1px solid ${theme.palette.divider}`,
                        backgroundColor: 'transparent',
                        outline: 'none',
                    },
                    suggestions: {
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 10,
                        maxHeight: 200,
                        overflowY: 'auto',
                        padding: 5,
                    }
                }}
            >
                <Mention
                    trigger="@"
                    data={mentionUsers}
                    markup="@__display__(__id__)"
                    appendSpaceOnAdd
                    displayTransform={(id, display) => `@${display}`}
                    style={{
                        backgroundColor: theme.palette.primary.main,
                        padding: '2px 2px',
                        borderRadius: 4,
                    }}
                />
            </MentionsInput>
        </div>
    );
}

MessageInput.propTypes = {
    inputValue: PropTypes.string.isRequired,
    setInputValue: PropTypes.func.isRequired,
    sendMessage: PropTypes.func.isRequired,
    chat: PropTypes.arrayOf(
        PropTypes.shape({
            username: PropTypes.string.isRequired,
            id_user: PropTypes.number.isRequired,
            message: PropTypes.string.isRequired,
            timestamp: PropTypes.string.isRequired,
        })
    ),
    onlineUsers: PropTypes.arrayOf(
        PropTypes.shape({
            id_user: PropTypes.number.isRequired,
            username: PropTypes.string.isRequired,
            timestamp: PropTypes.string.isRequired,
        })
    ),
};