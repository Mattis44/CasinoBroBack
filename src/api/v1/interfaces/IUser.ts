import { IAction } from "./IAction";
import { ICrypto } from "./ICrypto";
import { IForum } from "./IForum";
import { IForumResult } from "./IForumResult";
import { IReply } from "./Ireply";
import { ITransaction } from "./Itransactions";

export interface IUser {
	id_user?: string;

	str_username: string;
	str_email?: string;
	str_password?: string;
	str_bio?: string;
	avatar?: {
		id_avatar: number;
		str_url?: string;
	};
	banner?: {
		id_banner: number;
		str_url?: string;
	}
	date_creation?: Date;
	arr_transactions?: ITransaction[];
	arr_forums?: IForumResult;
	arr_replies?: IReply[];
	int_followers?: number;
	int_following?: number;
	is_following?: boolean;

	str_referral?: string;

	bl_admin?: boolean;
	bl_wallet?: boolean;
}
