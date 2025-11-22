import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthContext } from 'src/auth/hooks';

const SocketContext = createContext({
    socket: null,
    chat: [],
    onlineUsers: 0,
    setChat: () => { },
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [socket, setSocket] = useState(null);
    const [chat, setChat] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!user?.access_token) return;

        const newSocket = io("http://localhost:3000", {
            auth: {
                token: user.access_token,
                oauthType: localStorage.getItem("connection_type") || "classic",
            },
        });

        const handleMessage = (message) => {
            setChat((prevChat) => [
                ...prevChat,
                { ...message, unread: true }
            ]);
        };

        const handleOnlineUser = (userOnline) => {
            setOnlineUsers((prev) => {
                const existingUser = prev.find((u) => u.id_user === userOnline.id_user);
                if (existingUser) {
                    return prev.map((u) =>
                        u.id_user === userOnline.id_user ? userOnline : u
                    );
                }
                return [...prev, userOnline];
            });
        };

        const handleOfflineUser = (userId) => {
            setOnlineUsers((prev) => prev.filter((u) => u.id_user !== userId));
        }

        newSocket.on("connect", () => {
            console.log("🟢 Socket connecté :", newSocket.id);
        });

        newSocket.on("connect_error", (err) => {
            console.error("❌ Erreur de connexion socket:", err.message);
        });

        newSocket.on("chat:receive", handleMessage);
        newSocket.on("user:online", handleOnlineUser);
        newSocket.on("user:offline", handleOfflineUser);

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
            console.log("🔌 Socket déconnecté");
        };
    }, [user?.access_token, user?.id_user]);

    const contextValue = useMemo(
        () => ({
            socket,
            chat,
            onlineUsers,
            setChat,
        }),
        [socket, chat, onlineUsers]
    );

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};

SocketProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
