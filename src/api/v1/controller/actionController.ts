import axios from "axios";
import query from "../../../db";
import { IAction } from "../interfaces/IAction";
import { API_IMAGE_BASE_PATH } from "../utils/constants";

export async function getActionsByUserId(id_user: string): Promise<IAction[]> {
    try {
        const request = await query(
            `SELECT 
                u.id_user,
                u.str_name,
                u.str_symbol,
                u.str_isin,
                u.id_category,
                u.double_amount,
                str_libelle,
                u.id_method,
                u.double_pru
            FROM user_action u
            LEFT JOIN symbol s ON u.str_isin = s.str_isin
            LEFT JOIN logo l ON s.id_logo = l.id_logo
           WHERE u.id_user = ?
            `,
            [id_user]
        );
        
        const actions: IAction[] = await Promise.all(
            request.map(async (action: any) => {
        
                if (!action.str_libelle) {
                    const iconId = await getIconIdByInfo(`${action.str_name} ${action.str_isin} ${action.str_symbol}`);
                    action.str_libelle = iconId;
                    try {
                        await createErrorIcon(action, iconId);
                        await createNewIcon(action, iconId);
                    } catch (e) {
                        console.error("createErrorIcon|createNewIcon: ", e);
                    }
                }

                return {
                    id_user: action.id_user,
                    str_name: action.str_name,
                    str_symbol: action.str_symbol,
                    str_isin: action.str_isin,
                    id_category: action.id_category,
                    double_amount: action.double_amount,
                    str_logo: `${API_IMAGE_BASE_PATH + action.str_libelle}.svg`,
                    id_method: action.id_method,
                    double_pru: action.double_pru,
                };
            })
        );        
        return actions;
    } catch (err) {
        console.error("Error getting actions", err);
        throw err;
    }
}

export async function getActionById(id: string): Promise<IAction> {
    try {
        const result = await query(
            "SELECT * FROM user_action WHERE id_action = ?",
            [id]
        );
        if (result.length === 0) {
            return {
                id_user: "-1",
                str_name: "Not found",
                str_symbol: "Not found",
                str_isin: "Not found",
                id_category: "-1",
                double_amount: -1,
            };
        }
        const action: IAction = {
            id_user: result[0].id_user,
            str_name: result[0].str_name,
            str_symbol: result[0].str_symbol,
            str_isin: result[0].str_isin,
            id_category: result[0].id_category,
            double_amount: result[0].double_amount,
            double_pru: result[0].double_pru,
        };
        return action;
    } catch (err) {
        console.error("Error getting action", err);
        throw err;
    }
}

export async function createAction(action: IAction): Promise<boolean> {
    try {
        const result = await query(
            "INSERT INTO user_action (id_user, str_name, str_symbol, str_isin, id_category, double_amount) VALUES (?, ?, ?, ?, ?, ?)",
            [
                action.id_user,
                action.str_name,
                action.str_symbol ?? null,
                action.str_isin ?? null,
                action.id_category,
                action.double_amount,
            ]
        );
        return result.affectedRows === 1;
    } catch (err) {
        console.error("Error creating action", err);
        throw err;
    }
}

export async function createActionMultiple(
    actions: IAction[],
    method: string,
    id_user?: string
): Promise<boolean> {
    try {
        const methodQuery = `SELECT id_method FROM method WHERE str_name = ?`;
        const [methodResult] = await query(methodQuery, [method]);
        const methodId = methodResult?.id_method;

        if (!methodId) {
            throw new Error(`Method ${method} not found`);
        }

        const existingActionsQuery = `
            SELECT str_symbol, str_isin
            FROM user_action
            WHERE id_user = ? AND id_method = ?;
        `;
        const userId = actions.length > 0 ? actions[0].id_user || id_user : null;
        const existingActions = await query(existingActionsQuery, [userId, methodId]);

        const actionsToDelete = existingActions.filter((dbAction: any) => {
            return !actions.some((action) =>
                (action.str_symbol && action.str_symbol === dbAction.str_symbol) ||
                (action.str_isin && action.str_isin === dbAction.str_isin)
            );
        });

        if (actionsToDelete.length > 0) {
            const deleteQuery = `
                DELETE FROM user_action
                WHERE id_user = ? AND id_method = ? AND (
                    (str_symbol IN (${actionsToDelete.map(() => "?").join(", ")}) OR 
                    str_isin IN (${actionsToDelete.map(() => "?").join(", ")}))
                );
            `;
            const deleteParams = [
                userId,
                methodId,
                ...actionsToDelete.map((a: any) => a.str_symbol || ''),
                ...actionsToDelete.map((a: any) => a.str_isin || '')
            ];
            await query(deleteQuery, deleteParams);
        }

        const values = actions.map((action) => [
            action.id_user,
            action.str_name,
            action.str_symbol ?? null,
            action.str_isin ?? null,
            action.id_category,
            action.double_amount,
            action.double_pru ?? null,
            methodId,
        ]);

        const placeholders = values.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
        const queryString = `
            INSERT INTO user_action (id_user, str_name, str_symbol, str_isin, id_category, double_amount, double_pru, id_method)
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE
            str_name = VALUES(str_name),
            str_symbol = VALUES(str_symbol),
            str_isin = VALUES(str_isin),
            id_category = VALUES(id_category),
            double_amount = VALUES(double_amount),
            id_method = VALUES(id_method),
            double_pru = VALUES(double_pru);
        `;

        await query(queryString, values.flat());
        return true;
    } catch (err) {
        console.error("Error creating or updating actions", err);
        throw err;
    }
}

export async function getIconIdByInfo(info: string): Promise<any> {
    return new Promise((resolve, reject) => {
        if (!info) {
            reject("info manquant.");
        }
        const url = `https://symbol-search.tradingview.com/symbol_search/v3/?text=${info}&hl=1&exchange=&lang=fr&search_type=stocks&domain=production`;
        axios.get(url, {
            headers: {
                "Origin": "https://www.tradingview.com"
            }
        }).then((r) => {
            if (r.status === 200) {
                resolve(r.data.symbols[0].logoid);
            } else {
                reject(r.status);
            }
        });
    });
}

export async function createErrorIcon(action: IAction, new_libelle: string): Promise<boolean> {
    try {
        const result = await query(
            "INSERT INTO error_icon (id_user, str_name, str_symbol, str_isin, id_category, str_new_libelle_logo) VALUES (?, ?, ?, ?, ?, ?)",
            [
                action.id_user,
                action.str_name,
                action.str_symbol ?? null,
                action.str_isin ?? null,
                action.id_category,
                new_libelle,
            ]
        );
        return result.affectedRows === 1;
    } catch (err) {
        console.error("Error creating error icon", err);
        throw err;
    }
}

export async function getIdLogo(libelle: string): Promise<number | null> {
    try {
        const result = await query(
            "SELECT `id_logo` FROM `logo` WHERE `str_libelle` = ?",
            [libelle]
        );
        return result.length > 0 ? result[0].id_logo : null;
    } catch (err) {
        console.error("Error getting logo ID", err);
        throw err;
    }
}

export async function createNewIcon(action: IAction, new_libelle: string): Promise<boolean> {
    try {
        const idLogo = await getIdLogo(new_libelle);
        if (idLogo) {
            const result = await query(
                "INSERT INTO symbol (str_symbol, str_isin, str_nom, id_logo, id_type) VALUES (?, ?, ?, ?, ?)",
                [
                    action.str_symbol ?? null,
                    action.str_isin ?? null,
                    action.str_name,
                    idLogo,
                    action.id_category,
                ]
            );
            return result.affectedRows === 1;
        } else {
            return false;
        }
    } catch (err) {
        console.error("Error creating new icon", err);
        throw err;
    }
}

export async function searchActions(search: string, limit: number): Promise<IAction[]> {
    console.log("searchActions", search, limit);
    
    try {
        const result = await query(
            `
            SELECT 
                str_nom,
                str_symbol,
                str_isin,
                symbol.id_type,
                l.str_libelle,
                type.str_libelle as type
            FROM symbol 
            LEFT JOIN logo l ON symbol.id_logo = l.id_logo
            INNER JOIN type ON symbol.id_type = type.id_type
            WHERE str_nom LIKE ?
            OR str_symbol LIKE ?
            OR str_isin LIKE ?
            OR str_nom LIKE ?
            LIMIT ?;
            `,
            [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit]
        );
        const actions: IAction[] = result.map((action: any) => {
            return {
                str_name: action.str_nom,
                str_symbol: action.str_symbol,
                str_isin: action.str_isin,
                id_category: action.id_type,
                type: action.type,
                str_logo: `${API_IMAGE_BASE_PATH + action.str_libelle}.svg`,
                double_amount: -1,
            };
        });
        console.log(actions);
        
        return actions;
    } catch (err) {
        console.error("Error searching action", err);
        throw err;
    }
}