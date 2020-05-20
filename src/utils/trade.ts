import { ICompany } from './company';
import { IPosition } from './position';
import { IQuote } from './quote';
import { IAssessment } from './assessment';
import { Currency } from './enum';

export interface ITrade {
	symbol: string,
	currency: Currency
	price: number,
	priceUsd: number,
	priceCad: number,
	isSell: boolean,
	company?: ICompany,
	position?: IPosition,
	quote?: IQuote,
	assessment?: IAssessment,
	timestamp: number,
	pAndL: number,
	pnlUsd: number,
	pnlCad: number
}