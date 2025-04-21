import express from "express";
import { IUser } from "../../interfaces/IUser";
import { createHash } from "crypto";
import {
    createUser,
    getUserById,
    getUserByUsername,
    updateUser,
} from "../../controller/userController";
import {
    comparePassword,
    generateRefreshToken,
    generateToken,
    hashPassword,
    verifyRefreshToken,
    verifyToken,
} from "../../utils/hash";
import { IDecodedToken } from "../../interfaces/IDecodedToken";

const accountRouter = express.Router();

// Login an user
accountRouter.post("/login", async (req, res) => {
    try {
        const loginUser: IUser = {
            str_username: req.query.str_username as string,
            str_password: req.query.str_password as string,
        };

        const hash = createHash("sha256");
        hash.update(loginUser.str_password as string);
        const hashedPassword = hash.digest("hex");
        const user = await getUserByUsername(loginUser.str_username);
        if (!user) {
            res.json("Username is incorrect");
        } else if (hashedPassword === user.str_password) {
            const formattedUser: IUser = {
                id_user: user.id_user,
                str_username: user.str_username,
                str_email: user.str_email,
                bl_admin: user.bl_admin,
            };
            res.json({
                token_access: await generateToken({
                    ...formattedUser,
                }),
                refresh_token: await generateRefreshToken({
                    ...formattedUser,
                }),
                user: {
                    ...formattedUser,
                },
            });
        } else {
            res.status(401).json("Password or Username is incorrect");
        }
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Registed an user
accountRouter.post("/register", async (req, res) => {
    console.log(req.query);

    try {
        const user: IUser = {
            str_username: req.query.str_username as string,
            str_email: req.query.str_email as string,
            str_password: await hashPassword(req.query.str_password as string),
        };
        const newUser: IUser = await createUser(user);

        res.json({
            token_access: await generateToken({
                id_user: newUser.id_user,
                str_username: newUser.str_username,
                str_email: newUser.str_email,
                bl_admin: 0,
            }),
            refresh_token: await generateRefreshToken({
                id_user: newUser.id_user,
                str_username: newUser.str_username,
                str_email: newUser.str_email,
                bl_admin: 0,
            }),
            user: {
                id_user: newUser.id_user,
                str_username: newUser.str_username,
                str_email: newUser.str_email,
                bl_admin: 0,
            },
        });
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});
accountRouter.post("/me", async (req, res) => {
    try {
        const { accessToken, refreshToken } = req.body;
        try {
            const verif_access = await verifyToken(accessToken);
            const user = await getUserById(verif_access.id_user);
            const formattedUser: IUser = {
                id_user: user.id_user,
                str_username: user.str_username,
                str_email: user.str_email,
                bl_admin: user.bl_admin,
            };
            const UpdatedAccessToken = await generateToken({
                ...formattedUser,
            });

            res.status(200).json({
                access_token: UpdatedAccessToken,
                user,
            });
            console.log("Access token is valid");
        } catch (error) {
            try {
                const verif_refresh: IDecodedToken = await verifyRefreshToken(
                    refreshToken
                );
                const user = await getUserById(verif_refresh.id_user);
                const formattedUser: IUser = {
                    id_user: user.id_user,
                    str_username: user.str_username,
                    str_email: user.str_email,
                    bl_admin: user.bl_admin,
                };
                const UpdatedAccessToken = await generateToken({
					...formattedUser,
				});

                res.status(201).json({
                    access_token: UpdatedAccessToken,
                    user
                });
                console.log("access token is expired, refresh token is valid");
            } catch (error) {
                res.status(401).json("Tokens missing or invalid");
                console.log(error);
            }
        }
    } catch (error) {
        res.status(500).json("Tokens missing or invalid");
        console.log("Tokens missing or invalid 2");
    }
});

//Update an user
accountRouter.put("/update", async (req, res) => {
    try {
        const user: IUser = await getUserByUsername(
            req.query.str_username as string
        );
        if (user.id_user === "-1") {
            res.json("Username is incorrect");
        } else {
            if (
                await comparePassword(
                    req.query.str_password as string,
                    user.str_password as string
                )
            ) {
                const updatedUser: IUser = {
                    id_user: user.id_user,
                    str_username: user.str_username,
                    str_email: user.str_email,
                    str_password: await hashPassword(
                        req.query.str_newpassword as string
                    ),
                    bl_admin: user.bl_admin,
                };
                console.log(updatedUser);
                const newUser: IUser = await updateUser(updatedUser);
                res.json(newUser);
            } else {
                res.json("Password is incorrect");
            }
        }
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});
export default accountRouter;
