import { IReply } from "./Ireply";
import { IUser } from "./IUser";

export interface IForum {
	id_forum?: number;
	str_title: string;
	str_content: string;
	date_creation?: Date;
	id_category: number;
	arr_replies?: IReply[];
	user?: IUser;
	category?: {
		str_title: string;
	};
	likes?: {
		count: number;
		str_user_like?: string;
		user_liked?: boolean;
	},
	reply?: {
		count: number;
	},
	views?: {
		count: number;
	},
	bl_starred?: boolean;
	bl_formation?: boolean;
	date_starred?: Date;
}
