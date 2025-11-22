import { Avatar, Box, Button, Divider, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../../../auth/hooks';
import { useSocket } from '../../../contexts/socket/ws';
import MessageInput from './components/MessageInput';
import DOMPurify from 'dompurify';
import moment from 'moment';

export const formatMentions = (text, currentUserId) => {
  const escaped = DOMPurify.sanitize(text);

  return escaped.replace(
    /@([^\s@()]+)\(([^)]+)\)/g,
    (_, username, id) => {
      const style = `
        ${id === currentUserId ? "color:rgb(245, 102, 102)" : "color: #1DA1F2"};
        font-weight: bold;
      `;
      return `<span style="${style}">@${username}</span>`;
    }
  );
};

export default function ChatPage() {
  const { user } = useAuthContext();
  const { socket, chat, setChat, onlineUsers } = useSocket();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const sendMessage = (message) => {
    if (!socket || !user) return;

    const newMessage = {
      username: user.username,
      id_user: user.id_user,
      message,
      timestamp: new Date().toISOString(),
    };

    socket.emit('chat:send', newMessage);
  };

  useEffect(() => {
    setChat((prev) => prev.map((msg) => msg.unread ? { ...msg, unread: false } : msg))
  }, [setChat]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) => theme.palette.background.paper,
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          display: 'flex',
          py: 2,
          px: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            justifyContent: "center",
            display: "flex",
            flexGrow: 1,
          }}
        >
          Chat
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '8px', height: '8px', backgroundColor: '#4caf50', borderRadius: '50%' }} />
          <Typography sx={{ ml: 1, fontSize: '0.875rem' }}>
            {onlineUsers?.length} online
          </Typography>
        </Box>
      </Box>

      <Divider />

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: 'calc(100vh - 320px)',
        }}
        ref={messagesEndRef}
      >
        {chat?.map((message, index) => {
          const isOwnMessage = user?.id_user === message.id_user;

          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                gap: 1
              }}
            >
              {isOwnMessage ? (
                <>
                  {/* Message à gauche, avatar à droite */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      minWidth: '5vw',
                      padding: 1,
                      borderRadius: 2,
                      backgroundColor: (theme) => theme.palette.primary.main,
                      color: '#fff',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                        flexDirection: 'row-reverse',
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {message.user.username}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body1"
                      dangerouslySetInnerHTML={{
                        __html: formatMentions(message.message, user?.id_user),
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', mt: 0.5 }}
                    >
                      {moment(message.timestamp).format('HH:mm')}
                    </Typography>
                  </Box>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {message.user?.username?.charAt(0).toUpperCase() || '?'}
                  </Avatar>
                </>
              ) : (
                <>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {message.user?.username?.charAt(0).toUpperCase() || '?'}
                  </Avatar>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      minWidth: '5vw',
                      padding: 1,
                      borderRadius: 2,
                      backgroundColor: (theme) => theme.palette.background.default,
                      color: 'inherit',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                        flexDirection: 'row',
                      }}
                    >
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {message.user.username}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body1"
                      dangerouslySetInnerHTML={{
                        __html: formatMentions(message.message, user?.id_user),
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', mt: 0.5 }}
                    >
                      {moment(message.timestamp).format('HH:mm')}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          );
        })}
      </Box>


      <Divider />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
        }}
      >
        <Avatar sx={{ width: 32, height: 32 }}>
          {user?.str_username ? user.str_username.charAt(0).toUpperCase() : '?'}
        </Avatar>

        <MessageInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          sendMessage={sendMessage}
          chat={chat}
          onlineUsers={onlineUsers}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            if (inputValue.trim()) {
              sendMessage(inputValue.trim());
              setInputValue('');
            }
          }}
          sx={{
            height: '100%',
          }}
        >
          Send
        </Button>
      </Box>
    </Box >
  );
}
