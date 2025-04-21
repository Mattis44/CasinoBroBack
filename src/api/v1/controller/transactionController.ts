import query from "../../../db";
import { ITransaction } from "../interfaces/Itransactions";

export async function getTransactionsByUserId(
	id_user: string
): Promise<ITransaction[]> {
	try {
		const request = await query(
			"SELECT * FROM user_transaction WHERE id_user = ?",
			[id_user]
		);
		const transactions: ITransaction[] = request.map(
			(transaction: ITransaction) => {
				return {
					id_transaction: transaction.id_transaction,
					id_user: transaction.id_user,
					id_element: transaction.id_element,
					str_type: transaction.str_type,
					str_side: transaction.str_side,
					date_creation: transaction.date_creation,
					double_amount: transaction.double_amount,
				};
			}
		);
		return transactions;
	} catch (err) {
		console.error("Error getting transactions", err);
		throw err;
	}
}

export async function getTransactionById(
	id_transaction: number
): Promise<ITransaction> {
	try {
		const result = await query(
			"SELECT * FROM user_transaction WHERE id_transaction = ?",
			[id_transaction]
		);
		if (result.length === 0) {
			return {
				id_transaction: -1,
				id_user: "",
				id_element: "",
				str_type: "",
				str_side: "",
				date_creation: new Date(),
				double_amount: 0,
				double_price: 0,
			};
		}
		const transaction: ITransaction = {
			id_transaction: result[0].id_transaction,
			id_user: result[0].id_user,
			id_element: result[0].id_element,
			str_type: result[0].str_type,
			str_side: result[0].str_side,
			date_creation: result[0].date_creation,
			double_amount: result[0].double_amount,
			double_price: result[0].double_price,
		};
		return transaction;
	} catch (err) {
		console.error("Error getting transaction", err);
		throw err;
	}
}

export async function createTransaction(
	transaction: ITransaction
): Promise<ITransaction> {
	try {
		const result = await query(
			"INSERT INTO user_transaction (id_user, id_element, str_type, str_side, double_amount, double_price) VALUES (?, ?, ?, ?, ?, ?)",
			[
				transaction.id_user,
				transaction.id_element,
				transaction.str_type,
				transaction.str_side,
				transaction.double_amount,
				transaction.double_price,
			]
		);
		transaction.id_transaction = result.insertId;
		return transaction;
	} catch (err) {
		console.error("Error creating transaction", err);
		throw err;
	}
}

export async function deleteTransaction(
	id_transaction: number
): Promise<ITransaction> {
	try {
		const transaction = await getTransactionById(id_transaction);
		await query("DELETE FROM user_transaction WHERE id_transaction = ?", [
			id_transaction,
		]);
		return transaction;
	} catch (err) {
		console.error("Error deleting transaction", err);
		throw err;
	}
}

export async function updateTransaction(
	transaction: ITransaction
): Promise<ITransaction> {
	try {
		await query(
			"UPDATE user_transaction SET id_user = ?, id_element = ?, str_type = ?, str_side = ?, double_amount = ? WHERE id_transaction = ?",
			[
				transaction.id_user,
				transaction.id_element,
				transaction.str_type,
				transaction.str_side,
				transaction.double_amount,
				transaction.id_transaction,
			]
		);
		return getTransactionById(transaction.id_transaction as number);
	} catch (err) {
		console.error("Error updating transaction", err);
		throw err;
	}
}
