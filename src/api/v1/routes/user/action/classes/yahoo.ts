import { WebSocket as WS } from "ws";
import protobuf from "protobufjs";
import axios from "axios";
import { load } from "cheerio";

export default class Yahoo {
    public WS: WS | null = null;
    private subscriptions: { [key: string]: (data: any) => void } = {};
    private datas: any[] = [];
    private tickers: string[] = [];
    private processedTickers: Set<string> = new Set(); // Ensemble pour suivre les tickers déjà traités

    constructor() {
        this.WS = null;
        this.connect();
    }

    connect() {
        try {
            this.WS = new WS("wss://streamer.finance.yahoo.com", {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36",
                },
            });

            this.WS.on("error", (error) => {
                console.error("WebSocket error:", error);
            });

            this.WS.on("close", () => {
                setTimeout(() => this.connect(), 1000);
            });

            this.WS.on("message", (data) => {
                console.log("Incoming data:", data);

                this.handleIncomingData(data);
            });
        } catch (error) {
            console.error("Error connecting to Yahoo Finance:", error);
        }
    }

    static async getPriceFromYahoo(ticker: any) {
        try {
            const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}`;
            const { data } = await axios.get(url);
            const price = data.chart.result[0].meta.regularMarketPrice;
            const changePercent =
                (price - data.chart.result[0].meta.previousClose) /  data.chart.result[0].meta.previousClose * 100;
            return { price, changePercent };
        } catch (error) {
            console.error(
                `Erreur lors de la récupération du prix pour ${ticker}:`,
                error
            );
        }
    }

    subscribeToTickers(tickers: string[], callback: (data: any) => void) {
        this.tickers = tickers;
        this.datas = [];
        this.processedTickers.clear();

        if (this.WS && this.WS.readyState === WS.OPEN) {
            this.WS.send(JSON.stringify({ subscribe: tickers }));
            tickers.forEach((ticker) => {
                this.subscriptions[ticker] = callback;
            });
        } else {
            console.error("WebSocket not connected or not open.");
        }
    }

    private handleIncomingData(data: any) {
        try {
            const dataString = data.toString("utf-8");
            const messageBase64 = dataString;

            if (!messageBase64) {
                console.warn(
                    "Aucune donnée Base64 trouvée dans le message reçu"
                );
                return;
            }

            const messageBytes = Buffer.from(messageBase64, "base64");

            protobuf.load(__dirname + "/yahoo.proto", (err, root: any) => {
                if (err) {
                    console.error(
                        "Erreur lors du chargement du fichier .proto:",
                        err
                    );
                    return;
                }

                const Yaticker = root.lookupType("yaticker");
                try {
                    const decodedMessage = Yaticker.decode(messageBytes);
                    const object = Yaticker.toObject(decodedMessage, {
                        enums: String,
                        longs: String,
                        bytes: String,
                        defaults: true,
                    });

                    const tickerId = object.id;

                    if (this.subscriptions[tickerId]) {
                        // Vérifier si ce ticker a déjà été traité
                        if (!this.processedTickers.has(tickerId)) {
                            // Stocker les données pour ce ticker
                            this.datas.push(object);
                            // Marquer le ticker comme traité
                            this.processedTickers.add(tickerId);

                            // Vérifier si toutes les données pour les tickers ont été reçues
                            if (this.datas.length === this.tickers.length) {
                                // Renvoyer toutes les données
                                this.subscriptions[tickerId](this.datas);
                                this.resetSubscriptions(); // Réinitialiser les souscriptions
                            }
                        }
                    } else {
                        console.error(
                            `No callback found for ticker: ${tickerId}`
                        );
                    }
                } catch (e) {
                    console.error(
                        "Erreur lors du décodage du message Protobuf:",
                        e
                    );
                }
            });
        } catch (error) {
            console.error("Error processing message from Yahoo:", error);
        }
    }

    private resetSubscriptions() {
        // Réinitialiser les données et les souscriptions
        this.datas = [];
        this.tickers = [];
        this.subscriptions = {};
        this.processedTickers.clear(); // Réinitialiser les tickers traités
        // Déconnexion si nécessaire
        this.WS?.close();
    }
}
