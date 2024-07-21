import { IDividend, IQuote, ITrade } from '../../../../declarations';
import { IOrder } from '../../../../declarations/order';
import { AssetType, Currency } from '../../../../src/utils/enum';
import {
	IQuestradeOrder,
	IQuestradeQuote,
	getAccounts,
	IQuestradeCompany,
} from './api';
import { ICloudDividend, ICloudTrade } from './cloud';

enum QuestradeOrderSide {
	Buy = 'Buy',
	Sell = 'Sell',
	BTO = 'BTO',
}

const isUsd = (symbol: string): boolean =>
	symbol.indexOf('.') === -1 || symbol.indexOf('.u.') !== -1;

export const mapTrade = (trade: ICloudTrade, usdToCadRate: number): ITrade => {
	const cadToUsdRate = 1 / usdToCadRate;
	const currency: Currency =
		trade.currency === 'usd' ? Currency.usd : Currency.cad;
	const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
	const cadRate = currency === Currency.cad ? 1 : usdToCadRate;

	trade.pnl = trade.pnl || 0;

	const account = getAccounts().find(
		({ accountId: id }) => id === trade.accountId.toString()
	);
	if (!account) {
		console.error('account not found', trade.accountId);
		throw new Error('account not found');
	}

	return {
		isSell: trade.action === 'sell',
		symbol: trade.symbol,
		accountId: trade.accountId.toString(),
		priceCad: trade.price * cadRate,
		priceUsd: trade.price * usdRate,
		timestamp: new Date(trade.date).getTime(),
		pnl: trade.pnl,
		pnlCad: trade.pnl * cadRate,
		pnlUsd: trade.pnl * usdRate,
		currency,
		price: trade.price,
		quantity: trade.quantity,
		action: trade.action,
		type: AssetType.stock,
		symbolId: trade.symbolId,
		taxable: account.isTaxable,
		accountPnl: 0,
		accountPnlCad: 0,
		accountPnlUsd: 0,
	};
};

export const mapOrder = (
	order: IQuestradeOrder,
	usdToCadRate: number
): IOrder => {
	const currency: Currency = isUsd(order.symbol) ? Currency.usd : Currency.cad;
	const cadToUsdRate = 1 / usdToCadRate;
	const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
	const cadRate = currency === Currency.cad ? 1 : usdToCadRate;

	const account = getAccounts().find(
		({ accountId: id }) => id === order.accountId.toString()
	);
	if (!account) {
		console.error('account not found', order.accountId);
		throw new Error('account not found');
	}
	return {
		symbol: order.symbol,
		limitPrice: order.limitPrice,
		limitPriceUsd: order.limitPrice * usdRate,
		limitPriceCad: order.limitPrice * cadRate,
		openQuantity: order.openQuantity,
		filledQuantity: order.filledQuantity,
		totalQuantity: order.totalQuantity,
		orderType: order.orderType,
		stopPrice: order.stopPrice,
		avgExecPrice: order.avgExecPrice,
		side: order.side,
		action: [QuestradeOrderSide.Buy, QuestradeOrderSide.BTO].includes(order.side)
			? 'buy'
			: 'sell',
		type: order.orderType,
		accountId: account.accountId,
		currency,
		symbolId: order.symbolId,
		virtual: false,
	};
};

export const mapQuote = (
	quote: IQuestradeQuote,
	usdToCadRate: number
): IQuote => {
	const cadToUsdRate = 1 / usdToCadRate;
	const currency: Currency = isUsd(quote.symbol) ? Currency.usd : Currency.cad;
	const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
	const cadRate = currency === Currency.cad ? 1 : usdToCadRate;

	return {
		symbol: quote.symbol,
		price: quote.lastTradePriceTrHrs,
		priceCad: quote.lastTradePriceTrHrs * cadRate,
		priceUsd: quote.lastTradePriceTrHrs * usdRate,
		currency,
		type: AssetType.stock,
		afterHoursPrice: quote.lastTradePrice,
		symbolId: quote.symbolId,
	};
};

export const mapCompany = (
	company: IQuestradeCompany,
	hisaSymbols: string[]
) => {
	return {
		symbol: company.symbol,
		name: company.description,
		prevDayClosePrice: company.prevDayClosePrice,
		pe: company.pe,
		yield: company.yield,
		type: AssetType.stock,
		marketCap: company.marketCap,
		exchange: company.exchange,
		highPrice52: company.highPrice52,
		lowPrice52: company.lowPrice52,
		hisa: hisaSymbols.includes(company.symbol),
	};
};

export const mapDividend = (
	dividend: ICloudDividend,
	usdToCadRate: number
): IDividend => {
	if (!(usdToCadRate > 0)) {
		// console.error('invalid usdToCadRate', usdToCadRate, new Date(dividend.date));
		usdToCadRate = 1.25;
	}
	const account = getAccounts().find(
		({ accountId: id }) => id === dividend.accountId.toString()
	);
	if (!account) {
		console.error('account not found', dividend.accountId);
		throw new Error('account not found');
	}
	const currency: Currency =
		dividend.currency === 'usd' ? Currency.usd : Currency.cad;
	const cadToUsdRate = 1 / usdToCadRate;
	const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
	const cadRate = currency === Currency.cad ? 1 : usdToCadRate;

	return {
		symbol: dividend.symbol,
		timestamp: new Date(dividend.date).getTime(),
		amount: dividend.amount,
		symbolId: dividend.symbolId,
		currency,
		accountId: account.accountId,
		amountCad: dividend.amount * cadRate,
		amountUsd: dividend.amount * usdRate,
	};
};
