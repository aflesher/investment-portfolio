import { IOrder, ITrade } from '../../../../declarations';
import { IAccount } from '../../../../declarations/account';
import { AssetType, Currency } from '../../../../src/utils/enum';
import { KrakenOpenOrder, KrakenTrade } from './api';

const account: IAccount = {
	accountId: 'kraken',
	name: 'kraken',
	displayName: 'Kraken',
	type: 'crypto',
	isTaxable: true,
	balances: [],
};

const getCurrencyAndSymbolFromPair = (pair: string) => {
	pair = pair.toLowerCase();
	let symbol = pair.replace(/(cad|usd)/, '');
	const currency = pair.replace(symbol, '') as Currency;

	symbol = symbol.replace(/(xxbtz)/, 'btc').replace(/(xethz)/, 'eth');

	return { symbol, currency };
};

export const mapTrade = (trade: KrakenTrade, usdToCadRate: number): ITrade => {
	const { symbol, currency } = getCurrencyAndSymbolFromPair(trade.pair || '');
	const price = Number(trade.price);
	const timestamp = Number(trade.time) * 1000;
	const cadToUsdRate = 1 / usdToCadRate;
	const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
	const cadRate = currency === Currency.cad ? 1 : usdToCadRate;
	const quantity = Number(trade.vol);

	return {
		isSell: trade.type === 'sell',
		symbol,
		accountId: 'binance',
		priceCad: price * cadRate,
		priceUsd: price * usdRate,
		timestamp,
		pnl: 0,
		pnlCad: 0,
		pnlUsd: 0,
		currency,
		price,
		quantity,
		action: trade.type === 'buy' ? 'buy' : 'sell',
		type: AssetType.crypto,
		account,
	};
};

export const mapOrder = (
	order: KrakenOpenOrder,
	usdToCadRate: number
): IOrder => {
	const { symbol, currency } = getCurrencyAndSymbolFromPair(order.pair || '');
	const cadToUsdRate = 1 / usdToCadRate;
	const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
	const cadRate = currency === Currency.cad ? 1 : usdToCadRate;
	return {
		symbol,
		limitPrice: Number(order.price),
		limitPriceUsd: Number(order.price) * usdRate,
		limitPriceCad: Number(order.price) * cadRate,
		openQuantity: Number(order.vol),
		filledQuantity: 0,
		totalQuantity: Number(order.vol),
		orderType: order.ordertype || 'buy',
		stopPrice: 0,
		avgExecPrice: 0,
		side: order.type || 'buy',
		action: order.type === 'buy' ? 'buy' : 'sell',
		type: order.ordertype || 'buy',
		account,
		currency,
	};
};
