import express from "express";
import { decodeToken } from "../../../utils/hash";
import { ITransaction } from "../../../interfaces/Itransactions";
import {
	createTransaction,
	deleteTransaction,
	getTransactionById,
	getTransactionsByUserId,
	updateTransaction,
} from "../../../controller/transactionController";
import { verifyUserWithFunction } from "../../../utils/wrappers";

const transactionRouter = express.Router();

// Get transactions of an user
transactionRouter.get("/", async (req, res) => {
	try {
		const { id_user } = await decodeToken(req);
		const transactions: ITransaction[] = await getTransactionsByUserId(id_user);
		res.json(transactions);
	} catch (error: any) {
		res.status(500).json(error.message);
	}
});

// Get transaction by id
transactionRouter.get("/:id_transaction", async (req, res) => {
	try {
		const transaction: ITransaction = await getTransactionById(
			parseInt(req.params.id_transaction)
		);
		if (transaction.id_transaction === -1) {
			res.status(404).json("Transaction not found");
		} else {
			res.json(transaction);
		}
	} catch (error: any) {
		res.status(500).json(error.message);
	}
});

// Create a transaction
transactionRouter.post("/", async (req, res) => {
	try {
		const { id_user } = await decodeToken(req);
		const transaction: ITransaction = {
			id_user: id_user,
			id_element: req.query.id_element as string,
			str_type: req.query.str_type as string,
			str_side: req.query.str_side as string,
			date_creation: new Date(),
			double_amount: req.query.double_amount as unknown as number,
			double_price: req.query.double_price as unknown as number,
		};
		const newTransaction: ITransaction = await createTransaction(transaction);
		res.json(newTransaction);
	} catch (error: any) {
		res.status(500).json(error.message);
	}
});

// Update a transaction by id
transactionRouter.put("/:id_transaction", async (req, res) => {
	try {
		const { id_user } = await verifyUserWithFunction(req, getTransactionById);
		const transaction: ITransaction = {
			id_transaction: parseInt(req.params.id_transaction),
			id_user: id_user,
			id_element: req.query.id_element as string,
			str_type: req.query.str_type as string,
			str_side: req.query.str_side as string,
			date_creation: (req.query.date_creation as unknown as Date) || new Date(),
			double_amount: req.query.double_amount as unknown as number,
			double_price: req.query.double_price as unknown as number,
		};
		const updatedTransaction: ITransaction = await updateTransaction(
			transaction
		);
		res.json(updatedTransaction);
	} catch (error: any) {
		res.status(500).json(error.message);
	}
});

// Delete a transaction by id
transactionRouter.delete("/:id_transaction", async (req, res) => {
	try {
		await verifyUserWithFunction(req, getTransactionById);
		const deletedTransaction: ITransaction = await deleteTransaction(
			parseInt(req.params.id_transaction)
		);
		res.json(deletedTransaction);
	} catch (error: any) {
		res.status(500).json(error.message);
	}
});

export default transactionRouter;
