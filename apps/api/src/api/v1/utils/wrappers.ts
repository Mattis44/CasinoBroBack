import { Request } from "express";
import { decodeToken } from "./hash";
import { IDecodedToken } from "../interfaces/IDecodedToken";

export async function verifyUserWithFunction(
	req: Request,
	func: any
): Promise<IDecodedToken> {
	const decoded_token = await decodeToken(req);

	const { id_user: id_user_verify } = await func(
		req.params.id_transaction ||
			req.params.id_action ||
			req.params.id_user ||
			(req.query.id_transaction as string) ||
			(req.query.id_action as string) ||
			(req.query.id_user as string)
	);
	console.log(id_user_verify, decoded_token.id_user);

	if (id_user_verify !== decoded_token.id_user) {
		throw new Error("Unauthorized user");
	}
	return decoded_token;
}
