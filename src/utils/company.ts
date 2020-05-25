import { AssetType } from './enum';

export interface ICompany {
	pe?: number,
	yield?: number,
	prevDayClosePrice: number,
	marketCap: number,
	name: string,
	symbol: string,
	type: AssetType,
	exchange: string
}