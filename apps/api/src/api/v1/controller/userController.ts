import query from "../../../db";
import { IUser } from "../interfaces/IUser";
import { v4 as uuidv4 } from "uuid";

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
        const result = await query(
            `
			SELECT user.id_user, 
            user.str_username, 
            user.str_email, 
            user.str_password, 
            user.bl_admin
			FROM user
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
            `SELECT user.id_user, user.str_username, user.str_email, user.bl_admin
            FROM user
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
            user.bl_admin
			FROM user
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
        if (!user.str_password) {
            await query(
                "INSERT INTO user (id_user, str_username, str_email) VALUES (?, ?, ?)",
                [id, user.str_username, user.str_email]
            );
        } else {
            await query(
                "INSERT INTO user (id_user, str_username, str_email, str_password) VALUES (?, ?, ?, ?)",
                [
                    id,
                    user.str_username,
                    user.str_email,
                    user.str_password,
                ]
            );
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
