import { IQuote, ITrade } from '../../../declarations';
import { IPosition, IPositionValues } from '../../../declarations/position';
import { Currency } from '../../../src/utils/enum';
import { getTodaysRate } from './exchange';
import { SYMBOL_FILTER } from './filter';

const DEBUG_POSITIONS: string[] = [];
const IGNORED_POSITIONS: string[] = [
	'ry.to',
	'cgc',
	'glh.cn',
	'trst.to',
	'spy31dec20p250.00',
	'btcff',
	'ausa.cn',
	'dlr.to',
	'dlr.u.to',
	'glh.cn.11480862',
	'pins20jan23c55.00',
	'chal.cn',
	'ele.vn',
	'dsf.vn',
];

const debug = (trade: ITrade, position: IPosition) => {
	if (!DEBUG_POSITIONS.includes(trade.symbol)) {
		return;
	}

	console.log('<<<<<<<<<<<<'.yellow);
	console.log(trade);
	console.log(position);
	console.log(
		`(${position.quantity}) ($${position.openPnl}) ${
			trade.isSell ? 'sell' : 'buy'
		}`.cyan
	);
	console.log('>>>>>>>>>>>>'.yellow);
};

const getDefaultPositionValues = (): IPositionValues => ({
	averageEntryPrice: 0,
	averageEntryPriceCad: 0,
	averageEntryPriceUsd: 0,
	quantity: 0,
	totalCost: 0,
	totalCostCad: 0,
	totalCostUsd: 0,
	currentMarketValue: 0,
	currentMarketValueCad: 0,
	currentMarketValueUsd: 0,
	openPnl: 0,
	openPnlCad: 0,
	openPnlUsd: 0,
	openPnlCadCurrentRate: 0,
});

const calculate = (
	t: ITrade,
	position: IPositionValues,
	quote: IQuote,
	usdToCadRate: number,
	isAccountPosition: boolean
) => {
	// buy
	if (!t.isSell) {
		position.totalCostCad += t.quantity * t.priceCad;
		position.totalCostUsd += t.quantity * t.priceUsd;
		position.totalCost += t.quantity * t.price;

		position.quantity += t.quantity;

		position.averageEntryPrice = position.totalCost / position.quantity;
		position.averageEntryPriceCad = position.totalCostCad / position.quantity;
		position.averageEntryPriceUsd = position.totalCostUsd / position.quantity;
	}

	// sell
	if (t.isSell) {
		position.quantity -= t.quantity;
		if (position.quantity < 0.001) {
			position.quantity = 0;
		}

		position.totalCost = position.quantity * position.averageEntryPrice;
		position.totalCostCad = position.quantity * position.averageEntryPriceCad;
		position.totalCostUsd = position.quantity * position.averageEntryPriceUsd;

		// set the pnl for each trade
		// we actually do want to calculate pnl based on account, not aggregated position
		// this is why it may appear that the pnl on a trade is incorrect when
		// looking at the position
		// TODO: actually I think we need to calculate and store both
		if (isAccountPosition) {
			t.accountPnl =
				t.quantity * t.price - t.quantity * position.averageEntryPrice;
			t.accountPnlCad =
				t.quantity * t.priceCad - t.quantity * position.averageEntryPriceCad;
			t.accountPnlUsd =
				t.quantity * t.priceUsd - t.quantity * position.averageEntryPriceUsd;
		} else {
			t.pnl = t.quantity * t.price - t.quantity * position.averageEntryPrice;
			t.pnlCad =
				t.quantity * t.priceCad - t.quantity * position.averageEntryPriceCad;
			t.pnlUsd =
				t.quantity * t.priceUsd - t.quantity * position.averageEntryPriceUsd;
		}
	}

	// always set the current market value
	position.currentMarketValue = position.quantity * quote.price;
	position.currentMarketValueCad = position.quantity * quote.priceCad;
	position.currentMarketValueUsd = position.quantity * quote.priceUsd;

	position.openPnl = position.currentMarketValue - position.totalCost;
	position.openPnlCad = position.currentMarketValueCad - position.totalCostCad;
	position.openPnlUsd = position.currentMarketValueUsd - position.totalCostUsd;
	position.openPnlCadCurrentRate =
		t.currency === Currency.usd
			? position.openPnl * usdToCadRate
			: position.openPnl;
};

export const getPositions = async (
	trades: ITrade[],
	quotes: IQuote[]
): Promise<IPosition[]> => {
	const usdToCadRate = await getTodaysRate();
	const positions: IPosition[] = [];
	const debugSymbols = {};
	console.log('positions.getPositions (start)'.gray);
	trades.forEach((t) => {
		if (IGNORED_POSITIONS.includes(t.symbol)) {
			return;
		}

		let position = positions.find((p) => p.symbol === t.symbol);

		// if it's a sell and we don't have a position we can just return (bad state)
		if (t.isSell && !position) {
			// console.log(`skipping ${t.symbol} ${new Date(t.timestamp)}`);
			return;
		}

		const quote = quotes.find((q) => q.symbol === t.symbol);
		if (!quote) {
			if (!debugSymbols[t.symbol]) {
				console.log(`no quote for ${t.symbol}`);
				debugSymbols[t.symbol] = true;
			}
			return;
		}

		// first buy
		if (!position) {
			position = {
				currency: t.currency,
				type: t.type,
				symbol: t.symbol,
				...getDefaultPositionValues(),
				accounts: [{ accountId: t.accountId, ...getDefaultPositionValues() }],
				symbolId: t.symbolId,
			};
			positions.push(position);
		}

		let accountPosition = position.accounts.find(
			(p) => p.accountId === t.accountId
		);
		if (!accountPosition) {
			accountPosition = { accountId: t.accountId, ...getDefaultPositionValues() };
			position.accounts.push(accountPosition);
		}

		// buy
		if (!t.isSell && position.quantity === 0) {
			position.openingTrade = t;
		}

		calculate(t, position, quote, usdToCadRate, false);
		calculate(t, accountPosition, quote, usdToCadRate, true);

		debug(t, position);
	});

	// remove any accounts that have no quantity
	positions.forEach((p) => {
		p.accounts = p.accounts.filter((a) => a.quantity > 0);
	});

	// remove any positions that have no quantity
	const filteredPositions = positions.filter(
		(p) =>
			p.quantity > 0 &&
			p.totalCostCad > 0 &&
			p.currentMarketValue > 50 &&
			!SYMBOL_FILTER.includes(p.symbol)
	);

	console.log(`positions.getPositions (end ${filteredPositions.length})`.gray);
	return filteredPositions;
};
