import { IQuote, ITrade } from '../../../declarations';
import { IPosition } from '../../../declarations/position';

const DEBUG_POSITIONS: string[] = [];
const IGNORED_POSITIONS: string[] = [
	'ry.to',
	'cgc',
	'glh.cn',
	'trst.to',
	'scr.to',
	'spy31dec20p250.00',
	'btcff',
	'ausa.cn',
	'dlr.to',
	'dlr.u.to',
	'glh.cn.11480862',
	'pins20jan23c55.00',
	'chal.cn',
	'gme',
	'ele.vn',
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

export const getPositions = (
	trades: ITrade[],
	quotes: IQuote[]
): IPosition[] => {
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
				averageEntryPrice: 0,
				averageEntryPriceCad: 0,
				averageEntryPriceUsd: 0,
				quantity: 0,
				totalCostUsd: 0,
				totalCostCad: 0,
				totalCost: 0,
				currentMarketValue: 0,
				currentMarketValueCad: 0,
				currentMarketValueUsd: 0,
				openPnl: 0,
				openPnlCad: 0,
				openPnlUsd: 0,
				accounts: [{ accountId: t.accountId, quantity: 0 }],
				symbolId: t.symbolId,
			};
			positions.push(position);
		}

		let accountPosition = position.accounts.find(
			(p) => p.accountId === t.accountId
		);
		if (!accountPosition) {
			accountPosition = { accountId: t.accountId, quantity: 0 };
			position.accounts.push(accountPosition);
		}

		// buy
		if (!t.isSell) {
			// if we are buying and the position is 0, this is the opening trade
			if (position.quantity === 0) {
				position.openingTrade = t;
			}
			position.totalCostCad += t.quantity * t.priceCad;
			position.totalCostUsd += t.quantity * t.priceUsd;
			position.totalCost += t.quantity * t.price;

			position.quantity += t.quantity;
			accountPosition.quantity += t.quantity;

			position.averageEntryPrice = position.totalCost / position.quantity;
			position.averageEntryPriceCad = position.totalCostCad / position.quantity;
			position.averageEntryPriceUsd = position.totalCostUsd / position.quantity;
		}

		// sell
		if (t.isSell) {
			position.quantity -= t.quantity;
			accountPosition.quantity -= t.quantity;

			position.totalCost = position.quantity * position.averageEntryPrice;
			position.totalCostCad = position.quantity * position.averageEntryPriceCad;
			position.totalCostUsd = position.quantity * position.averageEntryPriceUsd;

			// set the pnl for each trade
			t.pnl = t.quantity * t.price - t.quantity * position.averageEntryPrice;
			t.pnlCad =
				t.quantity * t.priceCad - t.quantity * position.averageEntryPriceCad;
			t.pnlUsd =
				t.quantity * t.priceUsd - t.quantity * position.averageEntryPriceUsd;
		}

		// always set the current market value
		position.currentMarketValue = position.quantity * quote.price;
		position.currentMarketValueCad = position.quantity * quote.priceCad;
		position.currentMarketValueUsd = position.quantity * quote.priceUsd;

		position.openPnl = position.currentMarketValue - position.totalCost;
		position.openPnlCad = position.currentMarketValueCad - position.totalCostCad;
		position.openPnlUsd = position.currentMarketValueUsd - position.totalCostUsd;

		debug(t, position);
	});

	console.log('positions.getPositions (end)'.gray);
	return positions.filter((p) => p.quantity > 0 && p.totalCostCad > 0);
};