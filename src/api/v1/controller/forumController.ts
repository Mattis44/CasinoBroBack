import query from "../../../db";
import { IFormation } from "../interfaces/IFormation";
import { IFormationStep } from "../interfaces/IFormationStep";
import { IForum } from "../interfaces/IForum";
import { IForumResult } from "../interfaces/IForumResult";
import { getUserById } from "./userController";

export async function getForums(size = 10): Promise<IForumResult> {
    try {
        const result = await query(
            `SELECT
			f.id_forum,
			f.str_title,
			f.str_content,
			f.date_creation,
			f.id_category,
			f.id_user,
            f.bl_starred,
            f.date_starred,
			u.str_username,
			u.str_email,
			fc.str_title AS str_category,
			COUNT(DISTINCT fl.id_user) AS int_likes,
			COUNT(DISTINCT fr.id_reply) AS int_replies,
			f.int_views,
            COUNT(fs.id_formation) as int_steps,
            f.date_formation,
            f.bl_formation
		FROM
			user_forum f
		INNER JOIN
			user u ON f.id_user = u.id_user
		INNER JOIN
			forum_category fc ON f.id_category = fc.id_category
		LEFT JOIN
			forum_like fl ON fl.id_forum = f.id_forum
		LEFT JOIN
			forum_reply fr ON fr.id_forum = f.id_forum
        LEFT JOIN
            formation_step fs ON f.id_forum = fs.id_formation
        WHERE
            f.bl_deleted = 0
		GROUP BY
			f.id_forum,
			f.str_title,
			f.str_content,
			f.date_creation,
			f.id_category,
			f.id_user,
			u.str_username,
			u.str_email,
			fc.str_title
		ORDER BY
			f.date_creation DESC		
		LIMIT ?;
            `,
            [size]
        );
        const countQuery = await query(
            `SELECT
                COUNT(f.id_forum) AS count
            FROM
                user_forum f
            INNER JOIN
                user u ON f.id_user = u.id_user
            INNER JOIN
                forum_category fc ON f.id_category = fc.id_category
            LEFT JOIN
                forum_like fl ON fl.id_forum = f.id_forum
            LEFT JOIN
                forum_reply fr ON fr.id_forum = f.id_forum
            WHERE
                f.bl_deleted = 0
                AND (f.bl_formation = 0 OR (f.bl_formation = 1 AND f.date_formation IS NOT NULL))
            `
        );
        const forums: IForum[] = await Promise.all(
            result.map(async (res: any) => {
                if (res.bl_formation && res.int_steps > 0) {
                    if (res.date_formation === null) {
                        return;
                    }
                    const stepsResult = await query(
                        `SELECT fs.str_title, fs.str_content
                    FROM formation_step fs
                    WHERE fs.id_formation = ?
                    `,
                        [res.id_forum]
                    );
                    const formation: IFormation = {
                        id_forum: res.id_forum,
                        str_title: res.str_title,
                        str_content: res.str_content,
                        date_creation: res.date_creation,
                        id_category: res.id_category,
                        user: await getUserById(res.id_user),
                        category: {
                            str_title: res.str_category,
                        },
                        likes: {
                            count: res.int_likes,
                        },
                        reply: {
                            count: res.int_replies,
                        },
                        views: {
                            count: res.int_views,
                        },
                        steps: stepsResult.map((step: IFormationStep) => {
                            return {
                                title: step.str_title,
                                content: step.str_content,
                            };
                        }),
                        date_formation: res.date_formation,
                        bl_formation: res.bl_formation,
                        bl_starred: res.bl_starred,
                        date_starred: res.date_starred,
                    };
                    return formation;
                }
                const forum: IForum = {
                    id_forum: res.id_forum,
                    str_title: res.str_title,
                    str_content: res.str_content,
                    id_category: res.id_category,
                    date_creation: res.date_creation,
                    bl_starred: res.bl_starred,
                    bl_formation: res.bl_formation,
                    date_starred: res.date_starred,
                    user: await getUserById(res.id_user),
                    category: {
                        str_title: res.str_category,
                    },
                    likes: {
                        count: res.int_likes,
                    },
                    reply: {
                        count: res.int_replies,
                    },
                    views: {
                        count: res.int_views,
                    },
                };

                return {
                    id_forum: forum.id_forum,
                    str_title: forum.str_title,
                    str_content: forum.str_content,
                    date_creation: forum.date_creation,
                    id_category: forum.id_category,
                    bl_starred: forum.bl_starred,
                    bl_formation: forum.bl_formation,
                    date_starred: forum.date_starred,
                    user: forum.user,
                    category: {
                        str_title: forum.category?.str_title,
                    },
                    likes: {
                        count: forum.likes?.count,
                    },
                    reply: {
                        count: forum.reply?.count,
                    },
                    views: {
                        count: forum.views?.count,
                    },
                };
            })
        );

        return {
            list: forums.filter(
                (forum) => forum !== null && forum !== undefined
            ),
            count: countQuery[0].count,
        };
    } catch (err) {
        console.error("Error getting forums", err);
        throw err;
    }
}

export async function getFormationsNeedAdmin(): Promise<IFormation[]> {
    try {
        const result = await query(
            `SELECT
            f.id_forum,
            f.str_title,
            f.str_content,
            f.date_creation,
            f.id_category,
            f.id_user,
            f.bl_starred,
            f.date_starred,
            u.str_username,
            u.str_email,
            fc.str_title AS str_category,
            COUNT(DISTINCT fl.id_user) AS int_likes,
            COUNT(DISTINCT fr.id_reply) AS int_replies,
            f.int_views,
            COUNT(fs.id_formation) as int_steps,
            f.date_formation,
            f.bl_formation
        FROM
            user_forum f
        INNER JOIN
            user u ON f.id_user = u.id_user
        INNER JOIN
            forum_category fc ON f.id_category = fc.id_category
        LEFT JOIN
            forum_like fl ON fl.id_forum = f.id_forum
        LEFT JOIN
            forum_reply fr ON fr.id_forum = f.id_forum
        LEFT JOIN
            formation_step fs ON f.id_forum = fs.id_formation
        WHERE
            f.bl_formation = 1
        AND 
            f.date_formation IS NULL
        AND 
            f.bl_deleted = 0
        GROUP BY
            f.id_forum,
            f.str_title,
            f.str_content,
            f.date_creation,
            f.id_category,
            f.id_user,
            u.str_username,
            u.str_email,
            fc.str_title
        ORDER BY
            f.date_creation DESC
            `
        );
        const forums: IFormation[] = await Promise.all(
            result.map(async (res: any) => {
                if (res.bl_formation && res.int_steps > 0) {
                    const stepsResult = await query(
                        `SELECT fs.str_title, fs.str_content
                    FROM formation_step fs
                    WHERE fs.id_formation = ?
                    `,
                        [res.id_forum]
                    );
                    const formation: IFormation = {
                        id_forum: res.id_forum,
                        str_title: res.str_title,
                        str_content: res.str_content,
                        date_creation: res.date_creation,
                        id_category: res.id_category,
                        user: await getUserById(res.id_user),
                        category: {
                            str_title: res.str_category,
                        },
                        likes: {
                            count: res.int_likes,
                        },
                        reply: {
                            count: res.int_replies,
                        },
                        views: {
                            count: res.int_views,
                        },
                        steps: stepsResult.map((step: IFormationStep) => {
                            return {
                                title: step.str_title,
                                content: step.str_content,
                            };
                        }),
                        date_formation: res.date_formation,
                        bl_formation: res.bl_formation,
                        bl_starred: res.bl_starred,
                        date_starred: res.date_starred,
                    };
                    return formation;
                }
            })
        );
        return forums;
    } catch (err) {
        console.error("Error getting forums", err);
        throw err;
    }
}

export async function getForumsByCategory(
    category: number,
    size = 10
): Promise<IForumResult> {
    try {
        const result = await query(
            `SELECT
			f.id_forum,
			f.str_title,
			f.str_content,
			f.date_creation,
			f.id_category,
			f.id_user,
            f.bl_starred,
            f.date_starred,
			u.str_username,
			u.str_email,
			fc.str_title AS str_category,
			COUNT(DISTINCT fl.id_user) AS int_likes,
			COUNT(DISTINCT fr.id_reply) AS int_replies,
			f.int_views,
            COUNT(fs.id_formation) as int_steps,
            f.date_formation,
            f.bl_formation
		FROM
			user_forum f
		INNER JOIN
			user u ON f.id_user = u.id_user
		INNER JOIN
			forum_category fc ON f.id_category = fc.id_category
		LEFT JOIN
			forum_like fl ON fl.id_forum = f.id_forum
		LEFT JOIN
			forum_reply fr ON fr.id_forum = f.id_forum
        LEFT JOIN
            formation_step fs ON f.id_forum = fs.id_formation
		WHERE
			fc.id_category = ?
        AND 
            f.bl_deleted = 0
		GROUP BY
			f.id_forum,
			f.str_title,
			f.str_content,
			f.date_creation,
			f.id_category,
			f.id_user,
			u.str_username,
			u.str_email,
			fc.str_title
		ORDER BY
			f.date_creation DESC
		LIMIT ?;
			`,
            [category, size]
        );
        const countQuery = await query(
            `SELECT
				COUNT(f.id_forum) AS count
			FROM
				user_forum f
			INNER JOIN
				user u ON f.id_user = u.id_user
			INNER JOIN
				forum_category fc ON f.id_category = fc.id_category
			LEFT JOIN
				forum_like fl ON fl.id_forum = f.id_forum
			LEFT JOIN
				forum_reply fr ON fr.id_forum = f.id_forum
			WHERE
				fc.id_category = ?
            AND 
                f.bl_deleted = 0
			`,
            [category]
        );
        const forums: IForum[] = await Promise.all(
            result.map(async (res: any) => {
                if (res.bl_formation && res.int_steps > 0) {
                    if (res.date_formation === null) {
                        return;
                    }
                    console.log("formation");
                    const stepsResult = await query(
                        `SELECT fs.str_title, fs.str_content
                    FROM formation_step fs
                    WHERE fs.id_formation = ?
                    `,
                        [res.id_forum]
                    );
                    const formation: IFormation = {
                        id_forum: res.id_forum,
                        str_title: res.str_title,
                        str_content: res.str_content,
                        date_creation: res.date_creation,
                        id_category: res.id_category,
                        user: await getUserById(res.id_user),
                        category: {
                            str_title: res.str_category,
                        },
                        likes: {
                            count: res.int_likes,
                        },
                        reply: {
                            count: res.int_replies,
                        },
                        views: {
                            count: res.int_views,
                        },
                        steps: stepsResult.map((step: IFormationStep) => {
                            return {
                                title: step.str_title,
                                content: step.str_content,
                            };
                        }),
                        date_formation: res.date_formation,
                        bl_formation: res.bl_formation,
                        bl_starred: res.bl_starred,
                        date_starred: res.date_starred,
                    };
                    return formation;
                }
                const forum: IForum = {
                    id_forum: res.id_forum,
                    str_title: res.str_title,
                    str_content: res.str_content,
                    id_category: res.id_category,
                    date_creation: res.date_creation,
                    bl_starred: res.bl_starred,
                    date_starred: res.date_starred,
                    user: await getUserById(res.id_user),
                    category: {
                        str_title: res.str_category,
                    },
                    likes: {
                        count: res.int_likes,
                    },
                    reply: {
                        count: res.int_replies,
                    },
                    views: {
                        count: res.int_views,
                    },
                };

                return {
                    id_forum: forum.id_forum,
                    str_title: forum.str_title,
                    str_content: forum.str_content,
                    date_creation: forum.date_creation,
                    id_category: forum.id_category,
                    bl_starred: forum.bl_starred,
                    date_starred: forum.date_starred,
                    user: forum.user,
                    category: {
                        str_title: forum.category?.str_title,
                    },
                    likes: {
                        count: forum.likes?.count,
                    },
                    reply: {
                        count: forum.reply?.count,
                    },
                    views: {
                        count: forum.views?.count,
                    },
                };
            })
        );

        return {
            list: forums.filter(
                (forum) => forum !== null && forum !== undefined
            ),
            count: countQuery[0].count,
        };
    } catch (err) {
        console.error("Error getting forums", err);
        throw err;
    }
}

export async function getForumsBySearch(
    search: string,
    size = 10
): Promise<IForumResult> {
    try {
        const result = await query(
            `SELECT
			f.id_forum,
			f.str_title,
			f.str_content,
			f.date_creation,
			f.id_category,
			f.id_user,
            f.bl_formation,
            f.date_formation,
            f.bl_starred,
            f.date_starred,
			u.str_username,
			u.str_email,
			fc.str_title AS str_category,
			COUNT(DISTINCT fl.id_user) AS int_likes,
			COUNT(DISTINCT fr.id_reply) AS int_replies,
			f.int_views,
            COUNT(fs.id_formation) as int_steps,
            f.bl_formation
		FROM
			user_forum f
		INNER JOIN
			user u ON f.id_user = u.id_user
		INNER JOIN
			forum_category fc ON f.id_category = fc.id_category
		LEFT JOIN
			forum_like fl ON fl.id_forum = f.id_forum
		LEFT JOIN
			forum_reply fr ON fr.id_forum = f.id_forum
        LEFT JOIN 
            formation_step fs ON f.id_forum = fs.id_formation
		WHERE
			f.str_title LIKE ?
        AND 
            f.bl_deleted = 0
		GROUP BY
            f.id_forum,
            f.str_title,
            f.str_content,
            f.date_creation,
            f.id_category,
            f.id_user,
            u.str_username,
            u.str_email,
            fc.str_title
		ORDER BY
			f.date_creation DESC
		LIMIT ?;
			`,
            [`%${search}%`, size]
        );
        const countQuery = await query(
            `SELECT
				COUNT(f.id_forum) AS count
			FROM
				user_forum f
			INNER JOIN
				user u ON f.id_user = u.id_user
			INNER JOIN
				forum_category fc ON f.id_category = fc.id_category
			LEFT JOIN
				forum_like fl ON fl.id_forum = f.id_forum
			LEFT JOIN
				forum_reply fr ON fr.id_forum = f.id_forum
			WHERE
				f.str_title LIKE ?
            AND 
                f.bl_deleted = 0
			`,
            [`%${search}%`]
        );
        const forums: IForum[] = await Promise.all(
            result.map(async (res: any) => {
                if (res.bl_formation && res.int_steps > 0) {
                    if (res.date_formation === null) {
                        return;
                    }
                    console.log("formation");
                    const stepsResult = await query(
                        `SELECT fs.str_title, fs.str_content
                    FROM formation_step fs
                    WHERE fs.id_formation = ?
                    `,
                        [res.id_forum]
                    );
                    const formation: IFormation = {
                        id_forum: res.id_forum,
                        str_title: res.str_title,
                        str_content: res.str_content,
                        date_creation: res.date_creation,
                        id_category: res.id_category,
                        user: await getUserById(res.id_user),
                        category: {
                            str_title: res.str_category,
                        },
                        likes: {
                            count: res.int_likes,
                        },
                        reply: {
                            count: res.int_replies,
                        },
                        views: {
                            count: res.int_views,
                        },
                        steps: (await stepsResult).map(
                            (step: IFormationStep) => {
                                return {
                                    title: step.str_title,
                                    content: step.str_content,
                                };
                            }
                        ),
                        date_formation: res.date_formation,
                        bl_formation: res.bl_formation,
                        bl_starred: res.bl_starred,
                        date_starred: res.date_starred,
                    };
                    return formation;
                }
                const forum: IForum = {
                    id_forum: res.id_forum,
                    str_title: res.str_title,
                    str_content: res.str_content,
                    id_category: res.id_category,
                    date_creation: res.date_creation,
                    bl_starred: res.bl_starred,
                    date_starred: res.date_starred,
                    user: await getUserById(res.id_user),
                    category: {
                        str_title: res.str_category,
                    },
                    likes: {
                        count: res.int_likes,
                    },
                    reply: {
                        count: res.int_replies,
                    },
                    views: {
                        count: res.int_views,
                    },
                };

                return {
                    id_forum: forum.id_forum,
                    str_title: forum.str_title,
                    str_content: forum.str_content,
                    date_creation: forum.date_creation,
                    id_category: forum.id_category,
                    bl_starred: forum.bl_starred,
                    date_starred: forum.date_starred,
                    user: forum.user,
                    category: {
                        str_title: forum.category?.str_title,
                    },
                    likes: {
                        count: forum.likes?.count,
                    },
                    reply: {
                        count: forum.reply?.count,
                    },
                    views: {
                        count: forum.views?.count,
                    },
                };
            })
        );
        return {
            list: forums.filter(
                (forum) => forum !== null && forum !== undefined
            ),
            count: countQuery[0].count,
        };
    } catch (err) {
        console.error("Error getting forums", err);
        throw err;
    }
}

export async function getForumById(
    id: number,
    id_user?: number
): Promise<IForum> {
    try {
        const result = await query(
            `SELECT 
			f.id_forum, 
			f.str_title, 
			f.str_content, 
			f.date_creation, 
			f.id_category, 
			f.id_user, 
            f.bl_starred,
            f.date_starred,
			u.str_username, 
			u.str_email, 
			fc.str_title AS str_category,  
			(
				SELECT 
					GROUP_CONCAT(fl.id_user SEPARATOR ',') 
				FROM 
					forum_like fl 
				WHERE 
					fl.id_forum = f.id_forum
			) AS str_user_like, 
			COUNT(fl.id_forum) AS int_likes,
			f.int_views,
            COUNT(fs.id_formation) as int_steps,
            f.date_formation,
            f.bl_formation
		FROM 
			user_forum f
		INNER JOIN 
			user u ON f.id_user = u.id_user
		INNER JOIN 
			forum_category fc ON f.id_category = fc.id_category
		LEFT JOIN 
			forum_like fl ON fl.id_forum = f.id_forum
        LEFT JOIN
            formation_step fs ON f.id_forum = fs.id_formation
		WHERE 
            f.id_forum = ?
        AND 
            f.bl_deleted = 0
		GROUP BY 
			f.id_forum
		ORDER BY 
			f.date_creation DESC		
            `,
            [id]
        );
        if (result.length === 0) {
            return {
                id_forum: -1,
                str_title: "",
                str_content: "",
                id_category: -1,
                date_creation: new Date(),
            };
        }
        if (result[0].bl_formation) {
            const stepsResult = await query(
                `SELECT fs.str_title, fs.str_content
            FROM formation_step fs
            WHERE fs.id_formation = ?
            `,
                [result[0].id_forum]
            );
            const formation: IFormation = {
                id_forum: result[0].id_forum,
                str_title: result[0].str_title,
                str_content: result[0].str_content,
                date_creation: result[0].date_creation,
                id_category: result[0].id_category,
                bl_starred: result[0].bl_starred,
                date_starred: result[0].date_starred,
                user: await getUserById(result[0].id_user),
                category: {
                    str_title: result[0].str_category,
                },
                likes: {
                    count: result[0].int_likes,
                    str_user_like: result[0].str_user_like,
                    user_liked: result[0].str_user_like
                        ?.split(",")
                        .includes(id_user?.toString()),
                },
                views: {
                    count: result[0].int_views,
                },
                steps: stepsResult.map((step: IFormationStep) => {
                    return {
                        title: step.str_title,
                        content: step.str_content,
                    };
                }),
                date_formation: result[0].date_formation,
                bl_formation: result[0].bl_formation,
            };
            return formation;
        }
        const forum: IForum = {
            id_forum: result[0].id_forum,
            str_title: result[0].str_title,
            str_content: result[0].str_content,
            id_category: result[0].id_category,
            date_creation: result[0].date_creation,
            bl_starred: result[0].bl_starred,
            date_starred: result[0].date_starred,
            user: await getUserById(result[0].id_user),
            category: {
                str_title: result[0].str_category,
            },
            likes: {
                count: result[0].int_likes,
                str_user_like: result[0].str_user_like,
                user_liked: result[0].str_user_like
                    ?.split(",")
                    .includes(id_user?.toString()),
            },
            views: {
                count: result[0].int_views,
            },
        };
        return forum;
    } catch (err) {
        console.error("Error getting forum", err);
        throw err;
    }
}

export async function getForumsByUserId(
    id_user: string
): Promise<IForumResult> {
    try {
        const result = await query(
            `SELECT
			f.id_forum,
			f.str_title,
			f.str_content,
			f.date_creation,
			f.id_category,
			f.id_user,
            f.bl_starred,
            f.date_starred,
			u.str_username,
			u.str_email,
			fc.str_title AS str_category,
			COUNT(DISTINCT fl.id_user) AS int_likes,
			COUNT(DISTINCT fr.id_reply) AS int_replies,
			f.int_views,
            COUNT(fs.id_formation) as int_steps,
            f.date_formation,
            f.bl_formation
		FROM
			user_forum f
		INNER JOIN
			user u ON f.id_user = u.id_user
		INNER JOIN
			forum_category fc ON f.id_category = fc.id_category
		LEFT JOIN
			forum_like fl ON fl.id_forum = f.id_forum
		LEFT JOIN
			forum_reply fr ON fr.id_forum = f.id_forum
        LEFT JOIN
            formation_step fs ON f.id_forum = fs.id_formation
        WHERE
            f.bl_deleted = 0
        AND
            f.id_user = ?
		GROUP BY
			f.id_forum,
			f.str_title,
			f.str_content,
			f.date_creation,
			f.id_category,
			f.id_user,
			u.str_username,
			u.str_email,
			fc.str_title
		ORDER BY
			f.date_creation DESC		
            `,
            [id_user]
        );
        const countQuery = await query(
            `SELECT
                COUNT(f.id_forum) AS count
            FROM
                user_forum f
            INNER JOIN
                user u ON f.id_user = u.id_user
            INNER JOIN
                forum_category fc ON f.id_category = fc.id_category
            LEFT JOIN
                forum_like fl ON fl.id_forum = f.id_forum
            LEFT JOIN
                forum_reply fr ON fr.id_forum = f.id_forum
            WHERE
                f.bl_deleted = 0
                AND (f.bl_formation = 0 OR (f.bl_formation = 1 AND f.date_formation IS NOT NULL))
            `
        );
        const forums: IForum[] = await Promise.all(
            result.map(async (res: any) => {
                if (res.bl_formation && res.int_steps > 0) {
                    if (res.date_formation === null) {
                        return;
                    }
                    const stepsResult = await query(
                        `SELECT fs.str_title, fs.str_content
                    FROM formation_step fs
                    WHERE fs.id_formation = ?
                    `,
                        [res.id_forum]
                    );
                    const formation: IFormation = {
                        id_forum: res.id_forum,
                        str_title: res.str_title,
                        str_content: res.str_content,
                        date_creation: res.date_creation,
                        id_category: res.id_category,
                        user: await getUserById(res.id_user),
                        category: {
                            str_title: res.str_category,
                        },
                        likes: {
                            count: res.int_likes,
                        },
                        reply: {
                            count: res.int_replies,
                        },
                        views: {
                            count: res.int_views,
                        },
                        steps: stepsResult.map((step: IFormationStep) => {
                            return {
                                title: step.str_title,
                                content: step.str_content,
                            };
                        }),
                        date_formation: res.date_formation,
                        bl_formation: res.bl_formation,
                        bl_starred: res.bl_starred,
                        date_starred: res.date_starred,
                    };
                    return formation;
                }
                const forum: IForum = {
                    id_forum: res.id_forum,
                    str_title: res.str_title,
                    str_content: res.str_content,
                    id_category: res.id_category,
                    date_creation: res.date_creation,
                    bl_starred: res.bl_starred,
                    bl_formation: res.bl_formation,
                    date_starred: res.date_starred,
                    user: await getUserById(res.id_user),
                    category: {
                        str_title: res.str_category,
                    },
                    likes: {
                        count: res.int_likes,
                    },
                    reply: {
                        count: res.int_replies,
                    },
                    views: {
                        count: res.int_views,
                    },
                };

                return {
                    id_forum: forum.id_forum,
                    str_title: forum.str_title,
                    str_content: forum.str_content,
                    date_creation: forum.date_creation,
                    id_category: forum.id_category,
                    bl_starred: forum.bl_starred,
                    bl_formation: forum.bl_formation,
                    date_starred: forum.date_starred,
                    user: forum.user,
                    category: {
                        str_title: forum.category?.str_title,
                    },
                    likes: {
                        count: forum.likes?.count,
                    },
                    reply: {
                        count: forum.reply?.count,
                    },
                    views: {
                        count: forum.views?.count,
                    },
                };
            })
        );
        return {
            list: forums.filter(
                (forum) => forum !== null && forum !== undefined
            ),
            count: countQuery[0].count,
        };
    } catch (err) {
        console.error("Error getting forum", err);
        throw err;
    }
}

export async function createForum(forum: IForum): Promise<number> {
    try {
        const result = await query(
            "INSERT INTO user_forum (str_title, str_content, id_category, id_user) VALUES (?, ?, ?, ?)",
            [
                forum.str_title,
                forum.str_content,
                forum.id_category,
                forum.user?.id_user,
            ]
        );
        return result.insertId;
    } catch (err) {
        console.error("Error creating forum", err);
        throw err;
    }
}

export async function createFormation(formation: IFormation): Promise<number> {
    const { str_title, str_content, id_category, user, steps, date_formation } =
        formation;
    try {
        const result = await query(
            "INSERT INTO user_forum (str_title, str_content, id_category, id_user, bl_formation) VALUES (?, ?, ?, ?, ?)",
            [str_title, str_content, id_category, user?.id_user, 1]
        );
        const formationId = result.insertId;
        for (const step of steps) {
            await query(
                "INSERT INTO formation_step (id_step, id_formation, str_title, str_content) VALUES (?, ?, ?, ?)",
                [
                    steps.indexOf(step),
                    formationId,
                    step.str_title,
                    step.str_content,
                ]
            );
        }
        return formationId;
    } catch (error) {
        console.error("Error creating formation", error);
        throw error;
    }
}

export async function updateForum(forum: IForum): Promise<IForum> {
    try {
        await query(
            "UPDATE user_forum SET str_title = ?, str_content = ? WHERE id_forum = ? AND id_category = ?",
            [
                forum.str_title,
                forum.str_content,
                forum.id_forum,
                forum.id_category,
            ]
        );
        return getForumById(forum.id_forum as number);
    } catch (err) {
        console.error("Error updating forum", err);
        throw err;
    }
}

export async function deleteForum(id: number): Promise<void> {
    try {
        const forumReq = await getForumById(id);
        await query("UPDATE user_forum SET bl_deleted = 1 WHERE id_forum = ?", [
            id,
        ]);
    } catch (err) {
        console.error("Error deleting forum", err);
        throw err;
    }
}

export async function getForumCategories() {
    try {
        const result = await query("SELECT * FROM forum_category");
        console.log(result);

        return result;
    } catch (err) {
        console.error("Error getting forum categories", err);
        throw err;
    }
}

export async function likeForum(forumId: number, userId: string) {
    try {
        await query(
            "INSERT INTO forum_like (id_forum, id_user) VALUES (?, ?)",
            [forumId, userId]
        );
    } catch (err) {
        console.error("Error liking forum", err);
        throw err;
    }
}

export async function unlikeForum(forumId: number, userId: string) {
    try {
        await query(
            "DELETE FROM forum_like WHERE id_forum = ? AND id_user = ?",
            [forumId, userId]
        );
    } catch (err) {
        console.error("Error unliking forum", err);
        throw err;
    }
}

export async function replyForum(
    forumId: number,
    userId: number,
    reply: string
) {
    try {
        await query(
            "INSERT INTO forum_reply (id_forum, str_reply, id_user) VALUES (?, ?, ?)",
            [forumId, reply, userId]
        );
    } catch (err) {
        console.error("Error replying to forum", err);
        throw err;
    }
}

export async function deleteForumReply(replyId: number) {
    try {
        await query("DELETE FROM forum_reply WHERE id_reply = ?", [replyId]);
    } catch (err) {
        console.error("Error deleting forum reply", err);
        throw err;
    }
}

export async function updateForumReply(replyId: number, reply: string) {
    try {
        await query("UPDATE forum_reply SET str_reply = ? WHERE id_reply = ?", [
            reply,
            replyId,
        ]);
    } catch (err) {
        console.error("Error updating forum reply", err);
        throw err;
    }
}

export async function getForumReplies(forumId: number) {
    try {
        const result = await query(
            `SELECT fr.str_reply, u.str_email, u.str_username, fr.date_creation, fr.id_user, a.str_url
			FROM forum_reply fr
			INNER JOIN user_forum f ON fr.id_forum = f.id_forum
			INNER JOIN user u ON fr.id_user = u.id_user
            LEFT JOIN user_avatar ua ON u.id_avatar = ua.id_avatar
            LEFT JOIN avatar a ON ua.id_avatar = a.id_avatar
			WHERE fr.id_forum = ?
            GROUP BY u.id_user
			`,
            [forumId]
        );
        return result;
    } catch (err) {
        console.error("Error getting forum replies", err);
        throw err;
    }
}

export async function getForumRepliesByUserId(userId: string) {
    try {
        const result = await query(
            "SELECT * FROM forum_reply WHERE id_user = ?",
            [userId]
        );
        return result;
    } catch (err) {
        console.error("Error getting forum replies", err);
        throw err;
    }
}

export async function incrementForumViews(forumId: number) {
    try {
        await query(
            "UPDATE user_forum SET int_views = int_views + 1 WHERE id_forum = ?",
            [forumId]
        );
    } catch (err) {
        console.error("Error incrementing forum views", err);
        throw err;
    }
}

export async function acceptFormationById(forumId: number) {
    try {
        await query(
            "UPDATE user_forum SET date_formation = ? WHERE id_forum = ?",
            [new Date(), forumId]
        );

        return await getForumById(forumId);
    } catch (err) {
        console.error("Error accepting formation", err);
        throw err;
    }
}

export async function starForumById(forumId: number) {
    try {
        await query("UPDATE user_forum SET bl_starred = 1 WHERE id_forum = ?", [
            forumId,
        ]);
        await query(
            "UPDATE user_forum SET date_starred = ? WHERE id_forum = ?",
            [new Date(), forumId]
        );
    } catch (err) {
        console.error("Error starring forum", err);
        throw err;
    }
}
