import { IAccount, IPosition } from '../../declarations';
import { AssetType, Currency } from './enum';

export const orderPnL = (
	avgSharePrice: number,
	limitPrice: number,
	quantity: number
) => (limitPrice - avgSharePrice) * quantity;

export const orderSellPriceGap = (quotePrice: number, limitPrice: number) =>
	(limitPrice - quotePrice) / quotePrice;

export const orderBuyPriceGap = (quotePrice: number, limitPrice: number) =>
	(quotePrice - limitPrice) / quotePrice;

export const orderPriceGap = (
	quotePrice: number,
	limitPrice: number,
	isSell: boolean
) => {
	if (!isSell) {
		return orderBuyPriceGap(quotePrice, limitPrice);
	}
	return orderSellPriceGap(quotePrice, limitPrice);
};

export const orderBuyNewAvgPrice = (
	openQuantity: number,
	avgSharePrice: number,
	limitPrice: number,
	orderQuantity: number
) => {
	return (
		(openQuantity * avgSharePrice + limitPrice * orderQuantity) /
		(openQuantity + orderQuantity)
	);
};

export const orderNewAvgPrice = (
	openQuantity: number,
	avgSharePrice: number,
	limitPrice: number,
	orderQuantity: number,
	isSell: boolean
) => {
	if (isSell) {
		return avgSharePrice;
	}

	return orderBuyNewAvgPrice(
		openQuantity,
		avgSharePrice,
		limitPrice,
		orderQuantity
	);
};

interface PortfolioAllocationPosition
	extends Pick<
		IPosition,
		'type' | 'currentMarketValueCad' | 'currentMarketValueUsd'
	> {
	company?: {
		hisa?: boolean;
	};
}

export const addUpCash = (accounts: IAccount[]) => {
	const cadCombined = accounts
		.map((q) => q.balances)
		.flat()
		.reduce((sum, q) => sum + q.amountCad, 0);
	const usdCombined = accounts
		.map((q) => q.balances)
		.flat()
		.reduce((sum, q) => sum + q.amountUsd, 0);

	return { cadCombined, usdCombined };
};

export const getPortfolioAllocations = (
	positions: PortfolioAllocationPosition[],
	accounts: IAccount[]
) => {
	const cashTotalValue = positions
		.filter(({ type, company }) => type === AssetType.cash || company?.hisa)
		.reduce((sum, { currentMarketValueCad }) => sum + currentMarketValueCad, 0);
	const stockTotalValue = positions
		.filter(({ type, company }) => type === AssetType.stock && !company?.hisa)
		.reduce((sum, { currentMarketValueCad }) => sum + currentMarketValueCad, 0);
	const cryptoTotalValue = positions
		.filter(({ type }) => type === AssetType.crypto)
		.reduce((sum, { currentMarketValueCad }) => sum + currentMarketValueCad, 0);

	const cash = addUpCash(accounts);

	const totalValue =
		cashTotalValue + stockTotalValue + cryptoTotalValue + cash.cadCombined;

	return {
		cash: cashTotalValue / totalValue,
		stock: stockTotalValue / totalValue,
		crypto: cryptoTotalValue / totalValue,
	};
};
