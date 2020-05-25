import { IAssessment } from './assessment';
import { Currency, AssetType } from './enum';
import { ICompany } from './company';
import { IQuote } from './quote';

export interface IPosition {
	currency: Currency,
	totalCost: number,
	totalCostCad: number,
	totalCostUsd: number,
	currentMarketValue: number,
	currentMarketValueCad: number,
	currentMarketValueUsd: number,
	quantity: number,
	averageEntryPrice: number,
	symbol: string,
	type: AssetType,
	assessment?: IAssessment,
	company?: ICompany,
	quote?: IQuote,
	openPnl: number,
	openPnlUsd: number,
	openPnlCad: number
}