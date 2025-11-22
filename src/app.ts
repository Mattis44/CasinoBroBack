import express from "express";
import userRouter from "./api/v1/routes/user/route";
import accountRouter from "./api/v1/routes/account/route";
import { API_BASE_PATH } from "./api/v1/utils/constants";
import dotenv from "dotenv";
import { authenticateToken } from "./api/v1/middleware/authenticateToken";
import cors from "cors";
import discordRouter from "./api/v1/routes/account/oauth/discord";
import blackjackRouter from "./api/v1/routes/blackjack/route";
import coinflipRouter from "./api/v1/routes/coinflip/route";
import { Server } from 'socket.io';
import { createServer } from 'http';
import initSocket from "./socket";


const PORT = 3000;

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET, POST, PUT, DELETE, OPTIONS"
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"Content-Type, Authorization, x-refresh-token"
	);
	next();
});

app.use(`${API_BASE_PATH}/user`, authenticateToken, userRouter);

app.use(`${API_BASE_PATH}/account`, accountRouter);
app.use(`${API_BASE_PATH}/account/discord`, discordRouter);

app.use(`${API_BASE_PATH}/blackjack`, authenticateToken, blackjackRouter);
app.use(`${API_BASE_PATH}/coinflip`, authenticateToken, coinflipRouter);

const server = createServer(app);
const io = new Server(server, {
	  cors: {
	origin: "*",
	methods: ["GET", "POST"]
  }
});

server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

initSocket(io);