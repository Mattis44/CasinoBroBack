export interface IReply {
	id_reply?: number;
	str_reply: string;
	date_creation: Date;
	id_user: string;
	id_forum: number;
	user?: {
		str_username: string;
		str_email: string;
	};
}
