import express from "express";
import WrapperSync from "./classes/WrapperSync";
import { getObject } from "../../../../../redisClient";
import { createAction, createActionMultiple } from "../../../controller/actionController";
import { IAction } from "../../../interfaces/IAction";
import { MainClient } from "binance";
import { saveUserApiKey } from "../../../controller/userController";
import { ICrypto } from "../../../interfaces/ICrypto";
import { createMultipleCrypto } from "../../../controller/cryptoController";

const syncRouter = express.Router();

syncRouter.post("/tr", async (req, res) => {
    try {
        const { phoneNumber, pin } = req.body;
        let countdown = 0;
        if (!phoneNumber || !pin) {
            res.status(400).json("Invalid request body.");
            return;
        }

        const wrapperSync = new WrapperSync({
            type: "TR",
            data: { phoneNumber, pin },
        });

        if (!wrapperSync) {
            res.status(500).json("Internal server error.");
            return;
        }

        countdown = await wrapperSync._trStarter();

        if (!countdown) {
            res.status(500).json("Internal server error.");
            return;
        }

        res.status(200).json({ countdown });
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

syncRouter.post("/tr/a2f", async (req, res) => {
    try {
        const { a2f, phoneNumber, id_user } = req.body;

        if (!a2f) {
            res.status(400).json("Invalid request body.");
            return;
        }

        const redisData = await getObject(phoneNumber);

        let wrapperSync: WrapperSync | null = null;

        if (!redisData) {
            res.status(400).json("Invalid request body.");
        }
        const data = redisData;
        wrapperSync = new WrapperSync({
            type: "TR",
            data: { phoneNumber, processId: data.processId },
        });

        wrapperSync.PROCESS_ID = data.processId;
        wrapperSync.COOKIE_JAR.setCookie(
            data.cookies,
            wrapperSync.TR_LOGIN_URL
        );
        wrapperSync.COOKIE_JAR.getCookiesSync(wrapperSync.TR_LOGIN_URL);

        if (wrapperSync) {
            console.log("WRAPPER SYNC A2F DONE");

            const categories = await wrapperSync._sendA2FCode(a2f);
            if (!categories) {
                res.status(500).json("Internal server error.");
                return;
            }
            for (let i = 0; i < categories.length; i++) {
                console.log(categories[i]);
                const isin = categories[i].isin;

                const info = await wrapperSync.getInfoByIsinTR(isin);
                const real_ticker = info.exchanges[0].symbolAtExchange;
                const isins = await wrapperSync.getTickersByInfo(isin);
                const names = await wrapperSync.getTickersByInfo(categories[i].name);
                const tickers = await wrapperSync.getTickersByInfo(real_ticker);

                let exchanges = [];

                for (let ij = 0; ij < tickers.length; ij++) {
                    let scr = 1;
                    if (tickers[ij].longname ? tickers[ij].longname.includes(categories[i].name) : tickers[ij].shortname.includes(categories[i].name)) {scr++;}
                    if (tickers[ij].longname ? tickers[ij].longname.includes(info.name) : tickers[ij].shortname.includes(info.name)) {scr++;}
                    if (tickers[ij].symbol.includes(real_ticker)) {scr++;}
                    exchanges.push({"score": scr, "info": tickers[ij]})
                }

                for (let ij = 0; ij < names.length; ij++) {
                    let scr = 1;
                    if (names[ij].longname ? names[ij].longname.includes(categories[i].name) : names[ij].shortname.includes(categories[i].name)) {scr++;}
                    if (names[ij].longname ? names[ij].longname.includes(info.name) : names[ij].shortname.includes(info.name)) {scr++;}
                    if (names[ij].symbol.includes(real_ticker)) {scr++;}
                    exchanges.push({"score": scr, "info": names[ij]})
                }

                for (let ij = 0; ij < isins.length; ij++) {
                    let scr = 1;
                    if (isins[ij].longname ? isins[ij].longname.includes(categories[i].name) : isins[ij].shortname.includes(categories[i].name)) {scr++;}
                    if (isins[ij].longname ? isins[ij].longname.includes(info.name) : isins[ij].shortname.includes(info.name)) {scr++;}
                    if (isins[ij].symbol.includes(real_ticker)) {scr++;}
                    exchanges.push({"score": scr, "info": isins[ij]})
                }

                let best = {"score": 0, "info": {"symbol": 0}};

                for (let ij = 0; ij < exchanges.length; ij++) {
                    if (exchanges[ij].score > best.score) {
                        best = exchanges[ij];
                    }
                }

                categories[i].ticker = best.info.symbol;
            }
            
            const actions: IAction[] = categories.map((category: any) => {
                return {
                    id_user,
                    str_name: category.name,
                    str_isin: category.isin,
                    str_symbol: category.ticker,
                    id_category: category.instrumentType === "stock" ? 1 : category.instrumentType === "fund" ? 2 : 3,
                    double_amount: category.netSize,
                    double_pru: category.averageBuyIn,
                };
            });
            const addAction = await createActionMultiple(actions, "TR");
            if (!addAction) {
                res.status(500).json("Internal server error.");
                return;
            }
            res.status(200).json({ status: "success"});
            
            
        } else {
            res.status(500).json("Internal server error.");
            return;
        }
    } catch (error: any) {
        res.status(500);
        console.error(error.message);
    }
});

syncRouter.post("/binance", async (req, res) => {
    try {
        const { apiKey, apiSecret, id_user } = req.body;
        if (!apiKey || !apiSecret) {
            res.status(400).json("Invalid request body.");
            return;
        }
        const client = new MainClient({
            api_key: apiKey,
            api_secret: apiSecret,
            syncIntervalMs: 1000,
        })
        if (!client) {
            res.status(500).json("Internal server error.");
            return;
        }
        const saveCredentials = await saveUserApiKey(id_user, apiKey, apiSecret, 3);
        if (!saveCredentials) {
            res.status(500).json("Internal server error.");
            return;
        }
        const accountInfo = await client.getBalances();
        const positiveAssets = accountInfo.filter((x: any) => (parseFloat(x.free) > 0 || parseFloat(x.locked) > 0));
        if (!positiveAssets) {
            res.status(500).json("No assets found with positive balance.");
            return;
        }
        const resolvedAssets = await Promise.all(
            positiveAssets.map(async (x: any) => {
            const amount = parseFloat(x.free) + parseFloat(x.locked);
            const priceInUsdt: any = await client.getSymbolPriceTicker({ symbol:`${x.coin}USDT`}).catch(() => null);
            if (!priceInUsdt || priceInUsdt?.price * amount <= 10) {
                return null;
            }
            return {
                id_user,
                str_name: x.name,
                str_symbol: x.coin,
                double_amount: amount,
            } as ICrypto;
        }));
        const assets: ICrypto[] = resolvedAssets.filter((x): x is ICrypto => x !== null) as ICrypto[];
        if (!assets) {
            res.status(500).json("No assets found with positive balance.");
            return;
        }

        const addCrypto = await createMultipleCrypto(assets, "BINANCE");
        if (!addCrypto) {
            res.status(500).json("Internal server error.");
            return;
        }

        res.status(200).json({ status: "success" });
    } catch (error: any) {
        console.log(error);
        res.status(500).json(error.message);
    }
});

export default syncRouter;
