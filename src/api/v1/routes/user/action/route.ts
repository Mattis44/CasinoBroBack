import express from "express";
import { IAction } from "../../../interfaces/IAction";
import {
    createActionMultiple,
	getActionsByUserId,
    searchActions,
} from "../../../controller/actionController";
import Yahoo from "./classes/yahoo";

const actionRouter = express.Router();
const yahoo = new Yahoo();

actionRouter.get("/", async (req, res) => {
	const { id_user } = req.body;
	try {
		const actions: IAction[] = await getActionsByUserId(id_user);
		if (actions.length === 0) {
			return res.json([]);
		}
		res.json(actions);
	} catch (error: any) {
		console.error("Error getting actions", error);
		res.status(500)
	}
});

actionRouter.post("/", async (req, res) => {
    const { id_user, actions } = req.body;
    if (!id_user || !actions || !Array.isArray(actions)) {
        return res.status(400).json({ error: "Invalid request body" });
    }
    console.log("actions", actions);
    
    const addActions = await createActionMultiple(actions.map((action) => {
        return {
            str_name: action.name,
            str_symbol: action.symbol,
            double_amount: action.quantity,
            id_user: id_user,
            double_pru: action.purchasePrice,
            id_category: action.category,
            str_isin: action.id,
        }
    }), "MANUAL");
    if (addActions) {
        return res.status(201).json({ status: "success"});
    } else {
        return res.status(500).json({ error: "An error occurred while adding actions" });
    }
});

actionRouter.get("/:search", async (req, res) => {
    try {
    const { search } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const request = await searchActions(search, limit);
    
    res.json(request);
    } catch (error: any) {
        console.error("Error getting actions", error);
        res.status(500)
    }
});

actionRouter.post("/price", async (req, res) => {
    const symbols = req.body.symbols;
    if (!symbols || !Array.isArray(symbols)) {
        return res.status(400).json({ error: "Invalid request body" });
    }

    try {
        // Obtenir la date actuelle
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();
        const isMarketOpen = false

        if (isMarketOpen) {
            yahoo.subscribeToTickers(symbols, (yahooData) => {
                if (yahooData) {
                    return res.json({
                        symbols: yahooData.map((data: any) => {
                            return {
                                symbol: data.id,
                                price: data.price,
                                changePercent: data.changePercent,
                            };
                        })
                    });
                }
            });
        } else {
            const priceDataPromises = symbols.map(async (ticker) => {
                try {
                    const priceData = await Yahoo.getPriceFromYahoo(ticker);
                    if (priceData) {
                        const { price, changePercent } = priceData;
                        
                        return { price, changePercent };
                    } else {
                        return null;
                    }
                } catch (error) {
                    console.error(`Erreur lors de la récupération des données pour ${ticker}:`, error);
                    return null;
                }
            });

            const priceDataResults = await Promise.all(priceDataPromises);
            const filteredResults = priceDataResults.filter(data => data !== null);

            return res.json({
                symbols: filteredResults.map((data: any, index: number) => {
                    return {
                        symbol: symbols[index],
                        price: data.price,
                        changePercent: data.changePercent,
                    };
                })
            });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données de prix:", error);
        res.status(500).json({ error: "An error occurred while fetching price data" });
    }
});







export default actionRouter;
