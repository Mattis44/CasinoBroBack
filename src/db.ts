import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	port: parseInt(process.env.DB_PORT || "3306"),
});

connection
	.then((conn) => {
		console.log("Connected to MySQL");
		return conn;
	})
	.catch((err) => {
		console.error("Error connecting to MySQL", err);
		process.exit(1);
	});

async function query(sql: string, params: any[] = []): Promise<any> {
	try {
		const [results] = await (await connection).execute(sql, params);
		return results;
	} catch (err) {
		console.error("Error executing query", err);
		throw err;
	}
}

export default query;
