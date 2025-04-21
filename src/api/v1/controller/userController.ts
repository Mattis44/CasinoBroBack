import query from "../../../db";
import { IUser } from "../interfaces/IUser";
import { v4 as uuidv4 } from "uuid";
import {
    API_AVATARS_BASE_PATH,
    API_BANNERS_BASE_PATH,
} from "../utils/constants";
import { getForumsByUserId } from "./forumController";
import { IForum } from "../interfaces/IForum";
import { IForumResult } from "../interfaces/IForumResult";

export async function getAllUsers(): Promise<IUser[]> {
    try {
        const request = await query("SELECT * FROM user");
        const users: IUser[] = request;
        return users;
    } catch (err) {
        console.error("Error getting users", err);
        throw err;
    }
}

export async function getUserById(id: string): Promise<IUser> {
    try {
        console.log("id", id);

        const result = await query(
            `
			SELECT user.id_user, 
            user.str_username, 
            user.str_email, 
            user.str_password, 
            user.bl_admin, 
            user.id_avatar, 
            avatar.str_url as avatar_url, 
            user.id_banner,
            banner.str_url as banner_url
			FROM user
			LEFT JOIN user_avatar ON user.id_avatar = user_avatar.id_avatar
			LEFT JOIN avatar ON user_avatar.id_avatar = avatar.id_avatar
            LEFT JOIN user_banner ON user.id_banner = user_banner.id_banner
            LEFT JOIN banner ON user_banner.id_banner = banner.id_banner
			WHERE user.id_user = ?`,
            [id]
        );
        if (result.length === 0) {
            return { id_user: "-1", str_username: "", str_password: "" };
        }
        const user: IUser = {
            id_user: result[0].id_user,
            str_username: result[0].str_username,
            str_email: result[0].str_email,
            str_password: result[0].str_password,
            bl_admin: result[0].bl_admin,
            avatar: result[0].id_avatar
                ? {
                      id_avatar: result[0].id_avatar,
                      str_url: `${API_AVATARS_BASE_PATH}${result[0].avatar_url}`,
                  }
                : undefined,
            banner: result[0].id_banner
                ? {
                      id_banner: result[0].id_banner,
                      str_url: `${API_BANNERS_BASE_PATH}${result[0].banner_url}`,
                  }
                : undefined,
        };
        return user;
    } catch (err) {
        console.error("Error getting user", err);
        throw err;
    }
}

export async function getUsersBySearch(search: string, limit: number = 10): Promise<IUser[]> {
    try {
        const result = await query(
            `SELECT user.id_user, user.str_username, user.str_email, user.bl_admin, user.id_avatar
            FROM user
            LEFT JOIN user_avatar ON user.id_avatar = user_avatar.id_avatar
            LEFT JOIN avatar ON user_avatar.id_avatar = avatar.id_avatar
            WHERE user.str_username LIKE ? OR user.str_email LIKE ?
            GROUP BY user.id_user
            LIMIT ?`,
            [`%${search}%`, `%${search}%`, limit]
        );

        const users: IUser[] = result.map((user: any) => {
            return {
                id_user: user.id_user,
                str_username: user.str_username,
                str_email: user.str_email,
                bl_admin: user.bl_admin,
                avatar: user.id_avatar
                    ? {
                          id_avatar: user.id_avatar,
                          str_url: `${API_AVATARS_BASE_PATH}${user.avatar_url}`,
                      }
                    : undefined,
            };
        });

        return users;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function getUserByUsername(username: string): Promise<IUser> {
    try {
        const result = await query(
            `
			SELECT 
            user.id_user, 
            user.str_username, 
            user.str_email, 
            user.str_password, 
            user.bl_admin, 
            user.id_avatar, 
            avatar.str_url as avatar_url,
            user.id_banner,
            banner.str_url as banner_url
			FROM user
			LEFT JOIN user_avatar ON user.id_avatar = user_avatar.id_avatar
			LEFT JOIN avatar ON user_avatar.id_avatar = avatar.id_avatar
            LEFT JOIN user_banner ON user.id_banner = user_banner.id_banner
            LEFT JOIN banner ON user_banner.id_banner = banner.id_banner
			WHERE user.str_username = ?
            GROUP BY user.id_user
			`,
            [username]
        );
        if (result.length === 0) {
            return { id_user: "-1", str_username: "", str_password: "" };
        }

        const user: IUser = {
            id_user: result[0].id_user,
            str_username: result[0].str_username,
            str_email: result[0].str_email,
            str_password: result[0].str_password,
            bl_admin: result[0].bl_admin,
            avatar: result[0].id_avatar
                ? {
                      id_avatar: result[0].id_avatar,
                      str_url: `${API_AVATARS_BASE_PATH}${result[0].avatar_url}`,
                  }
                : undefined,
            banner: result[0].id_banner
                ? {
                      id_banner: result[0].id_banner,
                      str_url: `${API_BANNERS_BASE_PATH}${result[0].banner_url}`,
                  }
                : undefined,
        };

        return user;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function getReferralCodeById(
    id: string
): Promise<{ referralCode: string; referralCount: number }> {
    try {
        const result = await query(
            "SELECT str_referral FROM user WHERE id_user = ?",
            [id]
        );
        const referralCount = await query(
            "SELECT COUNT(*) as count FROM user_referral WHERE id_parrain = ?",
            [id]
        );

        return {
            referralCode: result[0].str_referral,
            referralCount: referralCount[0].count,
        };
    } catch (err) {
        console.error("Error getting user", err);
        throw err;
    }
}

export async function getUserByReferralCode(
    referralCode: string
): Promise<IUser> {
    try {
        const result = await query(
            "SELECT * FROM user WHERE str_referral = ?",
            [referralCode]
        );
        if (result.length === 0) {
            return { id_user: "-1", str_username: "", str_password: "" };
        }
        const user: IUser = {
            id_user: result[0].id_user,
            str_username: result[0].str_username,
            str_email: result[0].str_email,
            str_referral: result[0].str_referral,
            bl_admin: result[0].bl_admin,
        };
        return user;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function isAdminById(id: string): Promise<boolean> {
    try {
        const result = await query(
            "SELECT bl_admin FROM user WHERE id_user = ?",
            [id]
        );
        return result[0].bl_admin === 1;
    } catch (err) {
        console.error("Error getting user", err);
        throw err;
    }
}

export async function createUser(user: IUser): Promise<IUser> {
    try {
        const id = uuidv4();
        const referralCode = uuidv4().split("-")[0];
        if (!user.str_password) {
            await query(
                "INSERT INTO user (id_user, str_username, str_email, str_referral) VALUES (?, ?, ?, ?)",
                [id, user.str_username, user.str_email, referralCode]
            );
        } else {
            await query(
                "INSERT INTO user (id_user, str_username, str_email, str_password, str_referral) VALUES (?, ?, ?, ?, ?)",
                [
                    id,
                    user.str_username,
                    user.str_email,
                    user.str_password,
                    referralCode,
                ]
            );
        }
        if (user.str_referral) {
            const referrer = await getUserByReferralCode(user.str_referral);
            if (referrer.id_user !== "-1") {
                await query(
                    "INSERT INTO user_referral (id_parrain, id_filleul, bool_status) VALUES (?, ?, ?)",
                    [referrer.id_user, id, 1]
                );
            }
        }
        return getUserById(id);
    } catch (err) {
        if ((err as any).code === "ER_DUP_ENTRY") {
            const existingUser = await getUserByUsername(user.str_username);
            return existingUser;
        }
        throw err;
    }
}

export async function updateUser(user: IUser): Promise<IUser> {
    try {
        await query(
            "UPDATE user SET str_username = ?, str_password = ? WHERE str_username = ?",
            [user.str_username, user.str_password, user.str_username]
        );
        return getUserById(user.id_user as string);
    } catch (err) {
        console.error("Error updating user", err);
        throw err;
    }
}

export async function getUserProfileById(id: string, id_user?: string): Promise<IUser> {
    if (!id) {
        throw new Error("User not found");
    }
    try {
        const result = await query(
            `
				SELECT 
                user.id_user, 
                user.str_username, 
                user.str_email, 
                user.id_avatar, 
                user.id_banner, 
                user.str_bio,
                user.bl_admin,
                bl_wallet,
                avatar.str_url as avatar_url,
                banner.str_url as banner_url,
                (SELECT COUNT(*) FROM user_followers WHERE id_user_followed = user.id_user) as int_followers,
                (SELECT COUNT(*) FROM user_followers WHERE id_user_who_follow = user.id_user) as int_following
                ${id_user ? ", (SELECT COUNT(*) FROM user_followers WHERE id_user_who_follow = ? AND id_user_followed = user.id_user) as is_following" : ""}
				FROM user
				LEFT JOIN user_avatar ON user.id_avatar = user_avatar.id_avatar
				LEFT JOIN avatar ON user_avatar.id_avatar = avatar.id_avatar
                LEFT JOIN user_banner ON user.id_banner = user_banner.id_banner
                LEFT JOIN banner ON user_banner.id_banner = banner.id_banner
				WHERE user.id_user = ?
                GROUP BY user.id_user
                `,
            id_user ? [id_user, id] : [id]
        );

        if (result.length === 0) {
            return { id_user: "-1", str_username: "", str_password: "" };
        }

        const forums: IForumResult = await getForumsByUserId(id);

        const user: IUser = {
            id_user: result[0].id_user,
            str_username: result[0].str_username,
            str_email: result[0].str_email,
            avatar: result[0].id_avatar
                ? {
                      id_avatar: result[0].id_avatar,
                      str_url: `${API_AVATARS_BASE_PATH}${result[0].avatar_url}`,
                  }
                : undefined,
            banner: result[0].id_banner
                ? {
                      id_banner: result[0].id_banner,
                      str_url: `${API_BANNERS_BASE_PATH}${result[0].banner_url}`,
                  }
                : undefined,
            str_bio: result[0].str_bio,
            int_followers: result[0].int_followers,
            int_following: result[0].int_following,
            is_following: id_user ? !!result[0].is_following : undefined,
            bl_admin: result[0].bl_admin,
            arr_forums: forums || [],
            bl_wallet: result[0].bl_wallet,
        };

        return user;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function updateUserProfileByid(user: IUser): Promise<IUser> {
    if (!user || !user.id_user) {
        throw new Error("User not found or invalid user ID");
    }

    try {
        const fields: string[] = [];
        const values: any[] = [];

        if (user.str_username) {
            fields.push(`str_username = ?`);
            values.push(user.str_username);
        }
        if (user.str_email) {
            fields.push(`str_email = ?`);
            values.push(user.str_email);
        }
        if (user.avatar) {
            fields.push(`id_avatar = ?`);
            values.push(user.avatar.id_avatar);
        } else if (user.avatar === null) {
            fields.push(`id_avatar = NULL`);
        }
        if (user.banner) {
            fields.push(`id_banner = ?`);
            values.push(user.banner.id_banner);
        } else if (user.banner === null) {
            fields.push(`id_banner = NULL`);
        }
        if (user.str_bio) {
            fields.push(`str_bio = ?`);
            values.push(user.str_bio);
        }
        if (typeof user.bl_wallet !== 'undefined') {
            fields.push(`bl_wallet = ?`);
            values.push(user.bl_wallet);
        }

        if (fields.length === 0) {
            throw new Error("No fields to update");
        }

        const queryStr = `UPDATE user SET ${fields.join(', ')} WHERE id_user = ?`;
        values.push(user.id_user);

        const result = await query(queryStr, values);

        if (result.affectedRows === 0) {
            throw new Error(`User with ID ${user.id_user} not found`);
        }

        // Return the updated user object
        return {
            id_user: user.id_user,
            str_username: user.str_username || "",
            str_email: user.str_email || "",
            avatar: user.avatar || undefined,
            banner: user.banner || undefined,
            str_bio: user.str_bio || "",
            bl_wallet: user.bl_wallet || false,
        };
    }
    catch (err: any) {
        console.error(err);
        throw err;
    }
}


export async function getUserAvatars(id_user: string): Promise<any> {
    try {
        const result = await query(
            `SELECT a.id_avatar, a.str_libelle, str_url
				FROM avatar a
				JOIN user_avatar ua ON a.id_avatar = ua.id_avatar
				WHERE ua.id_user = ?`,
            [id_user]
        );
        return result;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function getUserBanners(id_user: string): Promise<any> {
    try {
        const result = await query(
            `SELECT b.id_banner, b.str_libelle, str_url
                FROM banner b
                JOIN user_banner ub ON b.id_banner = ub.id_banner
                WHERE ub.id_user = ?`,
            [id_user]
        );
        return result;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

export async function followUser(
    id_user: string,
    id_following: string
): Promise<Boolean> {
    try {
        await query(
            `INSERT INTO user_followers (id_user_who_follow, id_user_followed) VALUES (?, ?)`,
            [id_user, id_following]
        );
        return true;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function unfollowUser(
    id_user: string,
    id_following: string
): Promise<Boolean> {
    try {
        await query(
            `DELETE FROM user_followers WHERE id_user_who_follow = ? AND id_user_followed = ?`,
            [id_user, id_following]
        );
        return true;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function getFollowersByIdUser(id_user: string): Promise<IUser[]> {
    try {
        const result = await query(
            `SELECT user.id_user, user.str_username, user.bl_admin, user.id_avatar, a.str_url as avatar_url
                FROM user
                JOIN user_followers uf ON user.id_user = uf.id_user_who_follow
                LEFT JOIN user_avatar ua ON user.id_avatar = ua.id_avatar
                LEFT JOIN avatar a ON ua.id_avatar = a.id_avatar
                WHERE uf.id_user_followed = ?
                GROUP BY user.id_user
                `,
            [id_user]
        );
        const Users: IUser[] = result.map((user: any) => {
            return {
                id_user: user.id_user,
                str_username: user.str_username,
                bl_admin: user.bl_admin,
                avatar: user.id_avatar
                    ? {
                          id_avatar: user.id_avatar,
                          str_url: `${API_AVATARS_BASE_PATH}${user.avatar_url}`,
                      }
                    : undefined,
            };
        });
        return Users;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function getFollowingByIdUser(id_user: string): Promise<IUser[]> {
    try {
        const result = await query(
            `SELECT user.id_user, user.str_username, user.bl_admin, user.id_avatar, a.str_url as avatar_url
                FROM user
                JOIN user_followers uf ON user.id_user = uf.id_user_followed
                LEFT JOIN user_avatar ua ON user.id_avatar = ua.id_avatar
                LEFT JOIN avatar a ON ua.id_avatar = a.id_avatar
                WHERE uf.id_user_who_follow = ?
                GROUP BY user.id_user
                `,
            [id_user]
        );
        const Users: IUser[] = result.map((user: any) => {
            return {
                id_user: user.id_user,
                str_username: user.str_username,
                bl_admin: user.bl_admin,
                avatar: user.id_avatar
                    ? {
                          id_avatar: user.id_avatar,
                          str_url: `${API_AVATARS_BASE_PATH}${user.avatar_url}`,
                      }
                    : undefined,
            };
        });
        return Users;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function getUserQuotesById(id_user: string): Promise<any[]> {
    try {
        const result = await query(
            `SELECT double_value, date_creation
                FROM user_quotes
                WHERE id_user = ?
                ORDER BY date_creation DESC
                `,
            [id_user]
        );
        return result;
    } catch (err: any) {
        console.error(err);
        throw err;
    }
}

export async function saveUserApiKey(id_user: string, apiKey: string, apiSecret: string, id_method: number): Promise<any> {
    if (!id_user || !apiKey || !apiSecret) {
        throw new Error("Invalid parameters");
    }
    try {
        await query(
            `INSERT INTO user_api (id_user, str_api_key, str_api_secret) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE str_api_key = ?, str_api_secret = ?, id_method = ?
                `, [id_user, apiKey, apiSecret, apiKey, apiSecret, id_method]
        );
        return true;
    }
    catch (err: any) {
        console.error(err);
        throw err;
    }
}