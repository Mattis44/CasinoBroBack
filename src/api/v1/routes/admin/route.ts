import express from "express";
import { IFormation } from "../../interfaces/IFormation";
import { acceptFormationById, getFormationsNeedAdmin, starForumById } from "../../controller/forumController";

const adminRouter = express.Router();

adminRouter.get("/formation", async (req, res) => {
    try {
        const formations: IFormation[] = await getFormationsNeedAdmin();
        if (formations[0] === undefined) {
            return res.json([]);
        }        
        res.json(formations);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
}); 

adminRouter.post("/formation/:id/accept", async (req, res) => {
    try {
        const { id } = req.params;
        await acceptFormationById(parseInt(id));
        res.status(200).json("Formation accepted");
        
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

adminRouter.post("/forum/:id/star", async (req, res) => {
    try {
        const { id } = req.params;
        await starForumById(parseInt(id));
        res.json("Forum starred");
    }
    catch (error: any) {
        res.status(500).json(error.message);
    }
});

export default adminRouter;