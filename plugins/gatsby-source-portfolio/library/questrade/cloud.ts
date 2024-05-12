import _ from 'lodash';
import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';

import * as api from './api';
import { Currency } from '../../../../src/utils/enum';
import { getStockSplits, updateStockSplit } from '../firebase';
import { getCustomTrades, getMappedSymbolIds, getMappedSymbols } from './data';

export interface ICloudTrade {
	symbol: string;
	date: Date;
	action: string;
	symbolId: number;
	currency: 'usd' | 'cad';
	price: number;
	quantity: number;
	type: string;
	accountId: number;
	hash: string;
	pnl: number;
}

export interface ICloudDividend {
	symbol;
	date: Date;
	amount: number;
	symbolId: number;
	currency: 'cad' | 'usd';
	accountId: number;
	hash: string;
}

const symbolChange = {
	'twd.vn': 'weed.to',
	acb: 'acb.to',
	fb: 'meta',
};

const changeSymbol = (symbol: string): string => {
	return symbolChange[symbol] || symbol;
};

// Creates a client
const storage = new Storage({
	keyFilename: './key.json',
});
const bucket = storage.bucket('dollar-jockey-5d690.appspot.com');
const tradesFile = bucket.file('trades.json');
const dividendsFile = bucket.file('dividends.json');

let trades: ICloudTrade[] = [];
const tradesMap = {};

let dividends: ICloudDividend[] = [];
const dividendsMap = {};

export const addDividend = (dividend: api.IQuestradeActivity): void => {
	if (!dividend.symbol) {
		return;
	}

	const hash = crypto
		.createHash('md5')
		.update(JSON.stringify(dividend))
		.digest('hex');
	if (dividendsMap[hash]) {
		return;
	}

	const symbol = changeSymbol(dividend.symbol.toLowerCase());

	dividends.push({
		symbol,
		date: dividend.tradeDate,
		amount: dividend.netAmount,
		symbolId: dividend.symbolId,
		currency: dividend.currency === 'CAD' ? Currency.cad : Currency.usd,
		accountId: Number(dividend.accountId),
		hash,
	});

	dividendsMap[hash] = true;
};

const addTrade = (trade: api.IQuestradeActivity): void => {
	if (!trade.symbol) {
		return;
	}

	const hash = crypto
		.createHash('md5')
		.update(JSON.stringify(trade))
		.digest('hex');
	if (tradesMap[hash]) {
		return;
	}

	let action = trade.action.toLowerCase();
	let price = trade.price;
	if (action == 'rei') {
		action = 'buy';
		price = Math.abs(trade.netAmount) / trade.quantity;
	}

	const symbol = changeSymbol(trade.symbol.toLowerCase());

	trades.push({
		symbol,
		date: trade.tradeDate,
		action,
		symbolId: trade.symbolId,
		currency:
			trade.currency.toLowerCase() === 'usd' ? Currency.usd : Currency.cad,
		price,
		quantity: Math.abs(trade.quantity),
		type: trade.action.toLowerCase(),
		accountId: trade.accountId,
		hash,
		pnl: 0,
	});

	tradesMap[hash] = true;
};

const addActivities = async (): Promise<boolean> => {
	const activitiesDetails = await api.getActivities();
	const activities = activitiesDetails.activities;

	_.forEach(activities, (activity) => {
		if (activity.type == 'Trades') {
			addTrade(activity);
		} else if (activity.type == 'Dividends') {
			addDividend(activity);
		} else if (activity.type == 'Dividend reinvestment') {
			addTrade(activity);
		} else {
			// Interest, Deposits, Other, Withdrawals Corporate actions
		}
	});

	return activitiesDetails.complete;
};

const loadTrades = async (): Promise<void> => {
	const data = await tradesFile.download();
	trades = JSON.parse(data[0].toString());
	_.forEach(trades, (trade) => {
		tradesMap[trade.hash] = true;
		trade.type = 'stock';
		trade.symbol = changeSymbol(trade.symbol.toLowerCase());
		trade.accountId = Number(trade.accountId);
	});
};

const loadDividends = async (): Promise<void> => {
	const data = await dividendsFile.download();
	dividends = JSON.parse(data[0].toString()).filter((d) => !!d.amount);
	dividends.forEach((dividend) => {
		dividendsMap[dividend.hash] = true;
		dividend.accountId = Number(dividend.accountId);
	});
};

const applyStockSplits = async () => {
	const stockSplits = await getStockSplits();

	stockSplits
		.filter(({ isApplied }) => !isApplied)
		.forEach(async (stockSplit) => {
			const splitTrades = trades.filter(
				({ symbol }) => symbol === stockSplit.symbol
			);
			splitTrades.forEach((trade) => {
				if (stockSplit.isReverse) {
					trade.price = trade.price * stockSplit.ratio;
					trade.quantity = Math.floor(trade.quantity / stockSplit.ratio);
				} else {
					trade.price = trade.price / stockSplit.ratio;
					trade.quantity = trade.quantity * stockSplit.ratio;
				}
			});
			stockSplit.isApplied = true;
			await updateStockSplit(stockSplit);
		});
};

const updateDividends = async (): Promise<void> => {
	await dividendsFile.save(JSON.stringify(dividends));
};

const updateTrades = async (): Promise<void> => {
	await tradesFile.save(JSON.stringify(trades));
};

const filterDuplicateTrades = () => {
	const tradesMap = {};
	trades = trades.filter((trade) => {
		if (tradesMap[trade.hash]) {
			return false;
		}
		tradesMap[trade.hash] = true;
		return true;
	});
};

export const sync = async (): Promise<void> => {
	console.log('questrade.sync (start)'.gray);

	// load from the cloud
	await loadTrades().catch(console.log);
	await loadDividends().catch(console.log);

	// fetch all new activities and add to memory
	let complete = false;
	while (!complete) {
		complete = await addActivities();
	}

	// apply any custom trades
	getCustomTrades().forEach((trade) => {
		if (!tradesMap[trade.hash]) {
			trades.push(trade);
			console.log(
				`adding custom trade: ${trade.symbol} ${trade.action} ${trade.quantity} ${trade.date}}`
					.yellow
			);
			tradesMap[trade.hash] = true;
		}
	});

	const mappedSymbols = getMappedSymbols();
	//	const mappedSymbolIds = getMappedSymbolIds();
	trades.forEach((trade) => {
		if (mappedSymbols[trade.symbol]) {
			trade.symbol = mappedSymbols[trade.symbol];
		}
		// if (mappedSymbolIds[trade.symbol]) {
		// 	trade.symbolId = mappedSymbolIds[trade.symbol];
		// }
	});
	dividends.forEach((dividend) => {
		if (mappedSymbols[dividend.symbol]) {
			dividend.symbol = mappedSymbols[dividend.symbol];
		}
		// if (mappedSymbolIds[dividend.symbol]) {
		// 	dividend.symbolId = mappedSymbolIds[dividend.symbol as string];
		// }
	});

	// apply stock splits
	await applyStockSplits();

	filterDuplicateTrades();

	// write back to the cloud
	await updateTrades().catch(console.log);
	await updateDividends().catch(console.log);
	console.log('questrade.sync (end)'.gray);
};

export const getTrades = (): ICloudTrade[] => {
	return trades;
};

export const getDividends = (): ICloudDividend[] => {
	return dividends;
};
