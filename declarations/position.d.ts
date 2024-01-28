import { IAssessment } from './assessment';
import { Currency, AssetType } from '../src/utils/enum';
import { ICompany } from './company';
import { IQuote } from './quote';

export interface IPositionValues {
	totalCost: number;
	totalCostCad: number;
	totalCostUsd: number;
	currentMarketValue: number;
	currentMarketValueCad: number;
	currentMarketValueUsd: number;
	quantity: number;
	averageEntryPrice: number;
	averageEntryPriceCad: number;
	averageEntryPriceUsd: number;
	openPnl: number;
	openPnlUsd: number;
	openPnlCad: number;
	openPnlCadCurrentRate: number;
}

interface IPositionAccount extends IPositionValues {
	accountId: string;
}

export interface IPosition extends IPositionValues {
	currency: Currency;
	symbol: string;
	type: AssetType;
	assessment?: IAssessment;
	company?: ICompany;
	quote?: IQuote;
	openingTrade?: ITrade;
	accounts: IPositionAccount[];
	symbolId?: number;
}
