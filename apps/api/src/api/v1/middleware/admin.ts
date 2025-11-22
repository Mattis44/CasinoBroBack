import { NextFunction, Response } from "express";
import { isAdminById } from "../controller/userController";

export const adminMiddleware = async (req: any, res: Response, next: NextFunction) => {
    const { id_user } = req.body;
    
    if (!id_user) {
        res.status(403).json("Forbidden");
        return;
    }
    const queryAdmin = await isAdminById(id_user);
    
    
    if (!queryAdmin) {
        res.status(403).json("Forbidden");
        return;
    }
    next();
};