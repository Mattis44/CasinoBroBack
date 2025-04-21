export interface ITransaction {
	id_transaction?: number;
	id_user: string;
	id_element: string;
	str_type: string;
	str_side: string;
	date_creation: Date;
	double_amount: number;
	double_price: number;
}
