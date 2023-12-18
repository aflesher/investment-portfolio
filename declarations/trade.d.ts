import { ICompany } from './company';
import { IPosition } from './position';
import { IQuote } from './quote';
import { IAssessment } from './assessment';
import { Currency, AssetType } from '../src/utils/enum';
import { IAccount } from './account';

export interface ITrade {
	symbol: string;
	currency: Currency;
	price: number;
	priceUsd: number;
	priceCad: number;
	isSell: boolean;
	company?: ICompany;
	position?: IPosition;
	quote?: IQuote;
	assessment?: IAssessment;
	timestamp: number;
	pnl: number;
	pnlUsd: number;
	pnlCad: number;
	quantity: number;
	action: string;
	accountId: number;
	type: AssetType;
	isOpeningPositionTrade: boolean;
	taxable: boolean;
	accountName: string;
}

export interface ITradeV2 {
	symbol: string;
	currency: Currency;
	price: number;
	priceUsd: number;
	priceCad: number;
	isSell: boolean;
	company?: ICompany;
	position?: IPosition;
	quote?: IQuote;
	assessment?: IAssessment;
	timestamp: number;
	pnl: number;
	pnlUsd: number;
	pnlCad: number;
	quantity: number;
	action: string;
	accountId: number;
	type: AssetType;
	account: IAccount;
}
