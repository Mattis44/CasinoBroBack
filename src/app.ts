import express from "express";
import userRouter from "./api/v1/routes/user/route";
import accountRouter from "./api/v1/routes/account/route";
import { API_BASE_PATH } from "./api/v1/utils/constants";
import actionRouter from "./api/v1/routes/user/action/route";
import cryptoRouter from "./api/v1/routes/user/crypto/route";
import dotenv from "dotenv";
import { authenticateToken } from "./api/v1/middleware/authenticateToken";
import transactionRouter from "./api/v1/routes/user/transaction/route";
import cors from "cors";
import discordRouter from "./api/v1/routes/account/oauth/discord";
import forumRouter from "./api/v1/routes/forum/route";
import forumActionsRouter from "./api/v1/routes/forum/actions/route";
import referralRouter from "./api/v1/routes/account/referral/route";
import adminRouter from "./api/v1/routes/admin/route";
import { adminMiddleware } from "./api/v1/middleware/admin";
import syncRouter from "./api/v1/routes/user/sync/route";
import profileRouter from "./api/v1/routes/user/profile/route";



dotenv.config();

const app = express();
const PORT = 3000;

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
app.use(`${API_BASE_PATH}/user/action`, authenticateToken, actionRouter);
app.use(`${API_BASE_PATH}/user/crypto`, authenticateToken, cryptoRouter);
app.use(
	`${API_BASE_PATH}/user/transaction`,
	authenticateToken,
	transactionRouter
);
app.use(`${API_BASE_PATH}/user/sync`, authenticateToken, syncRouter);
app.use(`${API_BASE_PATH}/user/profile`, authenticateToken, profileRouter);

app.use(`${API_BASE_PATH}/admin`, authenticateToken, adminMiddleware, adminRouter);

app.use(`${API_BASE_PATH}/account`, accountRouter);
app.use(`${API_BASE_PATH}/account/discord`, discordRouter);
app.use(`${API_BASE_PATH}/account/referral`, authenticateToken, referralRouter);

app.use(`${API_BASE_PATH}/forum`, authenticateToken, forumRouter);
app.use(`${API_BASE_PATH}/forum/:id/actions`, authenticateToken, forumActionsRouter);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
