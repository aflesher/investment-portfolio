import { ICash } from './cash';
import { Currency } from './enum';
import { IPosition } from './position';
import { IQuote } from './quote';
import { ITrade } from './trade';

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

export const addUpCash = (
	balances: Pick<ICash, 'accountId' | 'currency' | 'amountCad' | 'amountUsd'>[],
	currency: Currency,
	includeTradingBalances: boolean,
	includeSavingsBalances: boolean
) => {
	return balances
		.filter(
			({ accountId, currency: balanceCurrency }) =>
				((includeTradingBalances && !!accountId) ||
					(includeSavingsBalances && !accountId)) &&
				balanceCurrency === currency
		)
		.reduce(
			(sum, balance) =>
				sum + (currency === 'cad' ? balance.amountCad : balance.amountUsd),
			0
		);
};

export const getPositionsFromTrades = (
	trades: ITrade[],
	quotes: IQuote[]
): IPosition[] => {
	const positions: IPosition[] = [];
	trades.forEach((trade) => {
		let position = positions.find(
			(q) => q.symbol === trade.symbol && q.accountName === trade.accountName
		);

		if (!position) {
			position = {
				symbol: trade.symbol,
				currency: trade.currency,
				quantity: 0,
				currentMarketValueCad: 0,
				currentMarketValueUsd: 0,
				accountName: trade.accountName,
				totalCost: 0,
				totalCostCad: 0,
				totalCostUsd: 0,
				averageEntryPrice: 0,
				currentMarketValue: 0,
				type: trade.type,
				openPnl: 0,
				openPnlCad: 0,
				openPnlUsd: 0,
			};
			positions.push(position);
		}

		const quote = quotes.find((q) => q.symbol === position!.symbol);
		if (!quote) {
			return;
		}

		if (trade.isSell) {
			position.quantity -= trade.quantity;
		} else {
			position.quantity += trade.quantity;
		}

		position.currentMarketValueCad = position.quantity * quote.priceCad;
		position.currentMarketValueUsd = position.quantity * quote.priceUsd;
	});

	return positions;
};
