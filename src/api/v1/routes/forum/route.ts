import express from "express";
import {
    createFormation,
    createForum,
    deleteForum,
    getForumById,
    getForumCategories,
    getForums,
    getForumsByCategory,
    getForumsBySearch,
    incrementForumViews,
    updateForum,
} from "../../controller/forumController";
import { IForum } from "../../interfaces/IForum";
import { IForumResult } from "../../interfaces/IForumResult";
import { IFormation } from "../../interfaces/IFormation";
import { IFormationStep } from "../../interfaces/IFormationStep";
import { getUserById, isAdminById } from "../../controller/userController";

const forumRouter = express.Router();

forumRouter.get("/", async (req, res) => {
    try {
        const size = parseInt(req.query.size as string) || 10;
        if (req.query.search) {
            const search = req.query.search as string;
            const filteredForums: IForumResult = await getForumsBySearch(
                search,
                size
            );
            res.json(filteredForums);
        } else {
            const forums: IForumResult = await getForums(size);
            res.json(forums);
        }
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumRouter.get("/category/:id", async (req, res) => {
    const size = parseInt(req.query.size as string) || 10;
    try {
        const id = parseInt(req.params.id);
        const forums: IForumResult = await getForumsByCategory(id, size);
        res.json(forums);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumRouter.get("/categories", async (req, res) => {
    try {
        const categories: any = await getForumCategories();
        res.json(categories);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumRouter.get("/:id", async (req, res) => {
    try {
        const { id_user } = req.body;
        const id = parseInt(req.params.id);
        const forum: IForum | IFormation = await getForumById(id, id_user);
        if (
            (forum as IFormation).bl_formation &&
            !(forum as IFormation).date_formation
        ) {
            const queryAdmin = await isAdminById(id_user);
            if (!queryAdmin) {
                res.status(403).json("Forbidden");
                return;
            }
        }
        await incrementForumViews(id);
        res.json(forum);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumRouter.post("/", async (req: any, res) => {
    const {
        str_title,
        str_content,
        id_category,
        id_user,
        formation,
        steps,
    }: {
        str_title: string;
        str_content: string;
        id_category: number;
        id_user: string;
        formation: boolean;
        steps: IFormationStep[];
    } = req.body;

    try {
        if (formation) {
            const formation: IFormation = {
                str_title,
                str_content,
                id_category,
                user: await getUserById(id_user),
                steps: steps,
                date_formation: new Date(),
                bl_formation: true,
            };
            console.log(formation);

            await createFormation(formation);
            res.json(formation);
            return;
        }
        const forum: IForum = {
            str_title,
            str_content,
            id_category,
            user: await getUserById(id_user),
        };
        await createForum(forum);
        res.json(forum);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumRouter.put("/:id", async (req, res) => {
    try {
        const forumReq = await getForumById(parseInt(req.params.id));
        if (!forumReq) {
            res.status(404).json("Forum not found");
            return;
        }
        if (forumReq.user?.id_user !== req.body.id_user) {
            res.status(403).json("Forbidden");
            return;
        }
        const forum: IForum = {
            id_forum: parseInt(req.params.id),
            str_title: req.body.str_title,
            id_category: req.body.id_category,
            str_content: req.body.str_content,
            user: await getUserById(req.body.id_user),
        };
        await updateForum(forum);
        res.json(forum);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

forumRouter.delete("/:id", async (req, res) => {
    try {
        const forumReq = await getForumById(parseInt(req.params.id));
        if (!forumReq) {
            res.status(404).json("Forum not found");
            return;
        }
        if (forumReq.user?.id_user !== req.body.id_user) {
            res.status(403).json("Forbidden");
            return;
        }
        const id = parseInt(req.params.id);
        await deleteForum(id);
        res.json("Forum deleted");
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

export default forumRouter;
