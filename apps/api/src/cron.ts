import cron from "node-cron";
import { getAllUsers } from "./api/v1/controller/userController";
import { IUser } from "./api/v1/interfaces/IUser";
import { getActionsByUserId } from "./api/v1/controller/actionController";
import { IAction } from "./api/v1/interfaces/IAction";
import Yahoo from "./api/v1/routes/user/action/classes/yahoo";
import query from "./db";

cron.schedule("00 23 * * *", async () => {
    try {
        const users: IUser[] = await getAllUsers();
        
        for (const user of users) {
            if (!user.id_user) continue;

            const actions: IAction[] = await getActionsByUserId(user.id_user);
            if (actions.length === 0) continue;

            const totalValue = await Promise.all(
                actions.map(async (action) => {
                    const data = await Yahoo.getPriceFromYahoo(action.str_symbol);
                    return {
                        name: action.str_name,
                        symbol: action.str_symbol,
                        total: data?.price * action.double_amount,
                    };
                })
            );

            const sumTotal = totalValue.reduce((acc, item) => acc + (item.total || 0), 0);
            const result = await query(
                `
                INSERT INTO user_quotes (id_user, double_value)
                VALUES (?, ?)
                `,
                [user.id_user, sumTotal]
            );

            console.log("Inserted quote for user:", result);
        }
    } catch (error) {
        console.error('Error fetching users or actions:', error);
    }
});
