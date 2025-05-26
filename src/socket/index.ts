import { Server } from "socket.io";
import chatSocketHandler from "./handlers/chat";
import { verifyToken } from "../api/v1/utils/hash";
import { DISCORD_API_BASE_PATH } from "../api/v1/utils/constants";
import { getUserByUsername } from "../api/v1/controller/userController";

export default function initSocket(io: Server) {
    io.use(async (socket, next) => {
        const { token, oauthType } = socket.handshake.auth;
        if (!token || !oauthType) {
            return next(new Error("Authentication error"));
        }

        try {
            if (oauthType === "discord") {
                try {
                    const response = await fetch(
                        `${DISCORD_API_BASE_PATH}/oauth2/@me`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        }
                    );

                    if (!response.ok)
                        return next(new Error("Invalid Discord token"));

                    const data = await response.json();
                    const user = await getUserByUsername(data.user.username);

                    if (!user) return next(new Error("User not found"));

                    socket.data.user = {
                        id_user: user.id_user,
                        username: data.user.username,
                    };
                } catch (err) {
                    return next(new Error("Discord auth failed"));
                }
            } else if (oauthType === "classic") {
                const user = await verifyToken(token);
                if (!user) return next(new Error("Invalid token"));

                socket.data.user = {
                    id_user: user.id_user,
                    username: user.str_username,
                };
            }
            next();
        } catch (error) {
            return next(new Error("Authentication error"));
        }
    });
    io.on("connection", (socket) => {
        io.emit("user:online", {
            user: socket.data.user,
            id_user: socket.data.user.id_user,
            timestamp: new Date().toISOString(),
        });
        chatSocketHandler(io, socket);
        socket.on("disconnect", () => {
            io.emit("user:offline", {
                user: socket.data.user,
                id_user: socket.data.user.id_user,
                timestamp: new Date().toISOString(),
            });
        });
    });
}
