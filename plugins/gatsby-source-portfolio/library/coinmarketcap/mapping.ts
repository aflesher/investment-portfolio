import { ICryptoMetaData } from '../firebase';
import { ICoinMarketCapQuote } from './api';
import { ICompany } from '../../../../declarations';
import { AssetType } from '../../../../src/utils/enum';

export const mapToCompany = (
	quote: ICoinMarketCapQuote,
	metaData?: ICryptoMetaData
): ICompany => {
	return {
		marketCap: quote.marketCap,
		symbol: quote.symbol,
		name: quote.name,
		exchange: 'CMC',
		pe: undefined,
		yield: 0,
		prevDayClosePrice: quote.prevDayClosePrice,
		type: AssetType.crypto,
		highPrice52: metaData?.oneYearHighUsd || quote.price,
		lowPrice52: metaData?.oneYearLowUsd || quote.price,
		hisa: false,
	};
};
