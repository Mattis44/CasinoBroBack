import express from "express";
import { followUser, getFollowersByIdUser, getFollowingByIdUser, getUserAvatars, getUserBanners, getUserProfileById, unfollowUser, updateUserProfileByid } from "../../../controller/userController";
import { IUser } from "../../../interfaces/IUser";
import { API_AVATARS_BASE_PATH, API_BANNERS_BASE_PATH, API_IMAGE_BASE_PATH } from "../../../utils/constants";
import { IAction } from "../../../interfaces/IAction";
import { getActionsByUserId } from "../../../controller/actionController";

const profileRouter = express.Router();

profileRouter.get("/", async (req, res) => {
    try {
        const { id_user } = req.body;
        const user = await getUserProfileById(id_user);
        if (user?.id_user === "-1") {
            throw new Error("User not found");
        }
        res.json(user);
    } catch (error: any) {
        console.error("Error getting user", error);
        res.status(500).json(error.message);
    }
});

profileRouter.post("/follow", async (req, res) => {
    try {
        const { id_user, id_following } = req.body;
        const followed = await followUser(id_user, id_following);
        if (!followed) {
            throw new Error("User not found");
        }
        res.json({
            is_following: !!followed
        });
    } catch (error: any) {
        console.error("Error getting user", error);
        res.status(500).json(error.message);
    }
});

profileRouter.post("/unfollow", async (req, res) => {
    try {
        const { id_user, id_following } = req.body;
        const unfollowed = await unfollowUser(id_user, id_following);
        if (!unfollowed) {
            throw new Error("User not found");
        }
        res.json({
            is_following: !!!unfollowed
        });
    } catch (error: any) {
        console.error("Error getting user", error);
        res.status(500).json(error.message);
    }
});

profileRouter.get("/avatars", async (req, res) => {
    try {
        const { id_user } = req.body;
        const avatars = await getUserAvatars(id_user);
        const avatarList = avatars.map((avatar: any) => {
            return {
                ...avatar,
                str_url: `${API_AVATARS_BASE_PATH}${avatar.str_url}`
            }
        });
        return res.json(avatarList);
        
    } catch (error) {
        console.error("Error getting user", error);
    }
});

profileRouter.get("/banners", async (req, res) => {
    try {
        const { id_user } = req.body;
        const banners = await getUserBanners(id_user);
        const bannerList = banners.map((banner: any) => {
            return {
                ...banner,
                str_url: `${API_BANNERS_BASE_PATH}${banner.str_url}`
            }
        });
        return res.json(bannerList);
        
    } catch (error) {
        console.error("Error getting user", error);
    }
});

profileRouter.get("/follower/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const users: IUser[] = await getFollowersByIdUser(id)
        if (users.length === 0) {
            return res.json([]);
        }

        res.json(users);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

profileRouter.get("/following/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const users: IUser[] = await getFollowingByIdUser(id)
        if (users.length === 0) {
            return res.json([]);
        }

        res.json(users);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

profileRouter.get("/wallet/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const actions: IAction[] = await getActionsByUserId(id);
        if (actions.length === 0) {
            return res.json([]);
        }

        res.json(actions);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

profileRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { id_user } = req.body;
        const user = await getUserProfileById(id, id_user);
        if (user?.id_user === "-1") {
            throw new Error("User not found");
        }
        res.json(user);
    } catch (error: any) {
        console.error("Error getting user", error);
        res.status(500).json(error.message);
    }
});
profileRouter.post("/", async (req, res) => {
    try {
        const { id_user, str_username, str_email, avatar, banner, str_bio, bl_wallet } = req.body;
        const User: IUser = {
            id_user,
            str_username,
            str_email,
            avatar,
            banner,
            str_bio,
            bl_wallet
        };
        console.log(User);
        
        const user = await updateUserProfileByid(User);
        if (!user) {
            throw new Error("User not found");
        }
        res.json(user);
    } catch (error: any) {
        console.error("Error getting user", error);
        res.status(500).json(error.message);
    }
});

export default profileRouter;