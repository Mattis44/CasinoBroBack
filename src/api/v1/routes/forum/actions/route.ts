import express from "express";
import {
    getForumById,
    getForumReplies,
    likeForum,
    replyForum,
    unlikeForum,
} from "../../../controller/forumController";
import { IForum } from "../../../interfaces/IForum";
import { IReply } from "../../../interfaces/Ireply";
import { API_AVATARS_BASE_PATH } from "../../../utils/constants";

const forumActionsRouter = express.Router({ mergeParams: true });

forumActionsRouter.post("/like", async (req: any, res) => {
    try {
        const forumId = parseInt(req.params.id);
        if (!forumId) {
            res.status(400).json({ message: "Forum ID is required" });
        }
        const userId = req.body.id_user;
        await likeForum(forumId, userId);
        const forum: IForum = await getForumById(forumId, userId);
        res.json(forum);
    } catch (error: any) {
        if (error.code === "ER_DUP_ENTRY") {
            res.status(400).json({ message: "User already liked this forum" });
        } else {
            res.status(500).json(error.message);
        }
    }
});

forumActionsRouter.post("/unlike", async (req: any, res) => {
    try {
        const forumId = parseInt(req.params.id);
        if (!forumId) {
            res.status(400).json({ message: "Forum ID is required" });
        }
        const userId = req.body.id_user;
        await unlikeForum(forumId, userId);
        const forum: IForum = await getForumById(forumId, userId);
        res.json(forum);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumActionsRouter.get("/reply", async (req: any, res) => {
    try {
        const forumId = parseInt(req.params.id);
        if (!forumId) {
            res.status(400).json({ message: "Forum ID is required" });
            return;
        }
        const repliesReq = await getForumReplies(forumId);
        const replies: IReply[] = repliesReq.map((reply: any) => {
            return {
                id_reply: reply.id_reply,
                str_reply: reply.str_reply,
                date_creation: reply.date_creation,
                user: {
                    str_username: reply.str_username,
                    id_user: reply.id_user,
                    avatar: reply.str_url && {
                        str_url: `${API_AVATARS_BASE_PATH}${reply.str_url}`,
                    },
                },
            };
        });
        res.json(replies);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumActionsRouter.post("/reply", async (req: any, res) => {
    try {
        const forumId = parseInt(req.params.id);
        if (!forumId) {
            res.status(400).json({ message: "Forum ID is required" });
        }
        const reply = req.body.str_reply;
        await replyForum(forumId, req.body.id_user, reply);
        const replies: IReply[] = await getForumReplies(forumId);
        res.json(replies);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

export default forumActionsRouter;
