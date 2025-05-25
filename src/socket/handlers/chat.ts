import { Server, Socket } from "socket.io";

export default function chatSocketHandler(io: Server, socket: Socket) {
    socket.on("chat:send", (data) => {
        console.log("Chat message received:", data);
        io.emit("chat:receive", {
            username: data.username,
            message: data.message,
            id_user: data.id_user,
            timestamp: new Date().toISOString(),
        });
    });
}
