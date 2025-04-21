import query from "../../../db";
import { ICrypto } from "../interfaces/ICrypto";

export async function createCrypto(crypto: ICrypto, method: string): Promise<ICrypto> {
    try {
        const { id_user, str_name, str_symbol, double_amount, double_pru } = crypto;
        if (!id_user || !str_name || !double_amount) {
            throw new Error("Invalid crypto data");
        }

        const methodQuery = `SELECT id_method FROM method WHERE str_name = ?`;
        const [methodResult] = await query(methodQuery, [method]);
        const methodId = methodResult?.id_method;

       const result = await query(
            `INSERT INTO user_crypto (id_user, str_name, str_symbol, double_amount, double_pru, id_method) VALUES (?, ?, ?, ?, ?, ?)`,
            [id_user, str_name, str_symbol, double_amount, double_pru || 0, methodId]
        );

        if (result.rowCount === 0) {
            throw new Error("Failed to create crypto");
        }

        return result.rows[0] as ICrypto;
    } catch (error) {
        console.error("Error creating crypto:", error);
        throw new Error("Error creating crypto");
    }
}

export async function createMultipleCrypto(cryptos: ICrypto[], method: string): Promise<ICrypto[]> {
    try {
        const methodQuery = `SELECT id_method FROM method WHERE str_name = ?`;
        const [methodResult] = await query(methodQuery, [method]);
        const methodId = methodResult?.id_method;

        if (!methodId) {
            throw new Error("Invalid method name");
        }

        const values = cryptos.map(crypto => [
            crypto.id_user,
            crypto.str_name,
            crypto.str_symbol,
            crypto.double_amount,
            crypto.double_pru || 0,
            methodId
        ]);

        const placeholders = values.map((_, i) => `(?, ?, ?, ?, ?, ?)`).join(", ");

        const flatValues = values.flat();

        const queryText = `INSERT INTO user_crypto (id_user, str_name, str_symbol, double_amount, double_pru, id_method) VALUES ${placeholders}`;
        const result = await query(queryText, flatValues);

        if (result.rowCount === 0) {
            throw new Error("Failed to create cryptos");
        }

        return result.rows as ICrypto[];

    } catch (error) {
        console.error("Error creating multiple cryptos:", error);
        throw new Error("Error creating multiple cryptos");
    }
}

export async function getCryptosByUserId(id_user: number): Promise<ICrypto[]> {
    try {
        const queryText = `SELECT uc.*, m.str_name AS method_name FROM user_crypto uc JOIN method m ON uc.id_method = m.id_method WHERE uc.id_user = ?`;
        const [result] = await query(queryText, [id_user]);
        return result as ICrypto[] || [];
    } catch (error) {
        console.error("Error getting cryptos:", error);
        throw new Error("Error getting cryptos");
    }
}

export async function getCryptoById(id_user: number, id_crypto: number): Promise<ICrypto | null> {
    try {
        const queryText = `SELECT uc.*, m.str_name AS method_name FROM user_crypto uc JOIN method m ON uc.id_method = m.id_method WHERE uc.id_user = ? AND uc.id_user_crypto = ?`;
        const [result] = await query(queryText, [id_user, id_crypto]);
        return result.rows[0] as ICrypto || null;
    } catch (error) {
        console.error("Error getting crypto:", error);
        throw new Error("Error getting crypto");
    }
}
