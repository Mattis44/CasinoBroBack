import { wrapper } from "axios-cookiejar-support";
import axios, { AxiosInstance } from "axios";
import { CookieJar } from "tough-cookie";
import { WebSocket } from "ws";
import { getObject, setObject } from "../../../../../../redisClient";
import { API_HEADERS, TR } from "../../../../utils/constants";

export default class WrapperSync {
    public HEADERS: any;
    public COOKIE_JAR: CookieJar;
    public CLIENT: AxiosInstance;

    public TR_API_BASE_PATH: string;
    public TR_LOGIN_URL: string;
    public TR_WS_BASE_PATH: string;
    public PHONE_NUMBER: string;
    public PIN: string;
    public PROCESS_ID: string;
    public A2F_CODE: number;
    public WS: WebSocket | null;

    constructor({ type, data }: { type: string; data: any }) {
        this.HEADERS = API_HEADERS;
        this.COOKIE_JAR = new CookieJar();
        this.CLIENT = wrapper(
            axios.create({ jar: this.COOKIE_JAR, headers: this.HEADERS })
        );

        this.TR_API_BASE_PATH = "";
        this.TR_LOGIN_URL = "";
        this.TR_WS_BASE_PATH = "";
        this.PHONE_NUMBER = "";
        this.PIN = "";
        this.PROCESS_ID = "";
        this.A2F_CODE = 0;
        this.WS = null;

        if (type === "TR") {
            this.PHONE_NUMBER = data.phoneNumber;
            this.PIN = data.pin;
            this.TR_API_BASE_PATH = TR.TR_API_BASE_PATH;
            this.TR_LOGIN_URL = `${this.TR_API_BASE_PATH}/api/v1/auth/web/login`;
            this.TR_WS_BASE_PATH = TR.TR_WS_BASE_PATH;
        }
    }

    public async _trStarter() {
        try {
            const r = await this.CLIENT.post(this.TR_LOGIN_URL, {
                phoneNumber: this.PHONE_NUMBER,
                pin: this.PIN,
            });
            this.PROCESS_ID = r.data.processId;

            const cookies = this.COOKIE_JAR.getCookiesSync(this.TR_LOGIN_URL)
                .map((cookie) => `${cookie.key}=${cookie.value}`)
                .join("; ");
            const headers = this.CLIENT.defaults.headers;

            await setObject(this.PHONE_NUMBER, {
                processId: this.PROCESS_ID,
                cookies,
                headers,
            });

            return r.data.countdownInSeconds;
        } catch (error: any) {
            console.error("Erreur lors de l'appel à _trStarter:", error);
        }
    }

    public async getInfoByIsinTR(isin: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.WS) {
                const idsub = Math.floor(Math.random() * (99 - 10 + 1) + 99);
                this.WS.send(
                    `sub ${idsub} {"type":"instrument","id":"${isin}","jurisdiction":"FR"}`
                );
                this.WS.on("message", (data) => {
                    const msg = data.toString();
                    // console.log("WebSocket message:", msg);
    
                    if (msg.startsWith(`${idsub} `)) {
                        const infoData = JSON.parse(msg.slice(5));
                        // console.log("Info data:", infoData.exchanges);
                        this.WS?.send(`unsub ${idsub}`);
                        resolve(infoData);
                    }
                });

                this.WS.on("error", (error) => {
                    reject(error);
                });
    
                this.WS.on("close", () => {
                    console.log("WebSocket connection closed");
                });
            } else {
                reject("WebSocket connection not established");
            }

        });
    }
    public async _sendA2FCode(a2fCode: string) {
        if (!this.PHONE_NUMBER || !a2fCode) {
            console.error("PHONE_NUMBER ou a2fCode manquants.");
            return;
        }

        const redisData = await getObject(this.PHONE_NUMBER);
        if (!redisData) {
            console.error(
                "Aucune donnée trouvée dans Redis pour le numéro de téléphone:",
                this.PHONE_NUMBER
            );
            return;
        }

        const { processId, headers } = redisData;

        this.PROCESS_ID = processId;

        this.CLIENT.defaults.headers = headers;

        const verifyUrl = `${this.TR_LOGIN_URL}/${this.PROCESS_ID}/${a2fCode}`;
        try {
            const r = await this.CLIENT.post(verifyUrl);
            this.COOKIE_JAR.getCookiesSync(this.TR_LOGIN_URL);

            if (r.status === 200) {
                return await this._trInitWebSocket();
            } else {
                console.error(
                    "Erreur lors de l'envoi du code A2F, statut non-200:",
                    r.status
                );
            }
        } catch (error) {
            console.error("Erreur lors de l'envoi du code A2F:", error);
        }
    }

    public async _trInitWebSocket(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                let extraHeaders: { [key: string]: string } = {};
                let connectionMessage: {
                    locale: string;
                    platformId: string;
                    platformVersion: string;
                    clientId: string;
                    clientVersion: string;
                } = {
                    locale: "",
                    platformId: "",
                    platformVersion: "",
                    clientId: "",
                    clientVersion: "",
                };
                let connectId = 21;

                const cookies = this.COOKIE_JAR.getCookiesSync(
                    this.TR_LOGIN_URL
                );
                if (cookies.length > 0) {
                    const cookieStr = cookies
                        .map((cookie) => `${cookie.key}=${cookie.value}`)
                        .join("; ");
                    extraHeaders["Cookie"] = cookieStr;
                    connectionMessage = {
                        locale: "de",
                        platformId: "webtrading",
                        platformVersion: "chrome - 94.0.4606",
                        clientId: "app.traderepublic.com",
                        clientVersion: "5582",
                    };
                    connectId = 31;
                }

                const ws = new WebSocket(this.TR_WS_BASE_PATH, {
                    headers: extraHeaders,
                });

                ws.on("open", () => {
                    console.log("Connected to WebSocket");
                    ws.send(
                        `connect ${connectId} ${JSON.stringify(
                            connectionMessage
                        )}`
                    );
                });

                ws.on("message", (data) => {
                    const msg = data.toString();
                    // console.log("WebSocket message:", msg);

                    if (msg.startsWith("2 A")) {
                        try {
                            const positions = JSON.parse(
                                msg.slice(4)
                            ).categories.find(
                                (category: { categoryType: string }) =>
                                    category.categoryType === "stocksAndETFs"
                            ).positions;
                            this.WS = ws;
                            resolve(positions);
                        } catch (e) {
                            reject(e);
                        }
                    } else if (msg === "connected") {
                        console.log("WebSocket connection established");
                        ws.send(`sub 2 {"type":"compactPortfolioByType"}`);
                    } else {
                        // console.log("WebSocket message:", msg);
                    }
                });

                ws.on("error", (error) => {
                    console.error("WebSocket error:", error);
                    reject(error);
                });

                ws.on("close", () => {
                    console.log("WebSocket connection closed");
                });
            } catch (error) {
                console.error(
                    "Erreur lors de la connexion au WebSocket:",
                    error
                );
                reject(error);
            }
        });
    }

    public async getTickersByInfo(info: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!info) {
                reject("info manquant.");
            }
            const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${info}`;
            this.CLIENT.get(url).then((r) => {
                // console.log("Yahoo Finance response:", r.data);
                if (r.status === 200) {
                    const data = r.data.quotes;
                    // console.log("Yahoo Finance data:", data);
                    
                    resolve(data);
                } else {
                    reject(r.status);
                }
            });
        });
    }
}
