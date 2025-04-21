export interface IAction {
	id_user: string;
	str_name: string;
	str_symbol?: string;
	str_isin?: string;
	id_category: string;
	double_amount: number;
	str_logo?: string;
	double_pru?: number;
}
