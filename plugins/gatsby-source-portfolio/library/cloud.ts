import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
import _ from 'lodash';
import { Currency } from '../../../src/utils/enum';
import { IQuestradeActivity } from './questrade';

interface IProfitAndLose {
	currency: Currency,
	total: number,
	combined: boolean
}

export interface ICloudTrade {
	symbol: string,
	date: Date,
	action: string,
	symbolId: number,
	currency: 'usd' | 'cad',
	price: number,
	quantity: number,
	type: string,
	accountId: number,
	hash: string,
	pnl: number
}

export interface ICloudDividend {
	symbol,
	date: Date,
	amount: number,
	symbolId: number,
	currency: 'cad' | 'usd',
	accountId: number,
	hash: string
}

// Creates a client
const storage = new Storage({
	keyFilename: './key.json'
} as any);
const bucket = storage.bucket('dollar-jockey-5d690.appspot.com');
const tradesFile = bucket.file('trades.json');
const dividendsFile = bucket.file('dividends.json');

let trades: ICloudTrade[] = [];
const tradesMap = {};

let dividends: ICloudDividend[] = [];
const dividendsMap = {};

let profitsAndLosses: IProfitAndLose[] = [];

const symbolChange = {
	'twd.vn': 'weed.to',
	'acb': 'acb.to',
	'fb': 'meta'
};

const changeSymbol = (symbol: string): string => {
	return symbolChange[symbol] || symbol;
};

export const updateTrades = async (): Promise<void> => {
	await tradesFile.save(JSON.stringify(trades));
};

export const getTrades = async (): Promise<void> => {
	const data = await tradesFile.download();
	// const data = fs.readFileSync('trades.json', {encoding:'utf8', flag:'r'});
	trades = JSON.parse(data[0].toString());
	// trades = JSON.parse(data);
	_.forEach(trades, trade => {
		tradesMap[trade.hash] = true;
		trade.type = 'stock';
		// Example stock split
		// if (trade.symbol.toLocaleLowerCase() === 'shop.to') {
		// 	trade.price = trade.price / 10;
		// 	trade.quantity = trade.quantity * 10;
		// }
	});
};

const getCustomTrades = (): ICloudTrade[] => ([
	{
		symbol: 'spy17apr20p200.00',
		date: new Date('2020-04-20'),
		accountId: 51637118,
		action: 'sell',
		symbolId: 27994113,
		currency: 'usd',
		price: 0,
		quantity: 12,
		type: 'stock',
		hash: '',
		pnl: -1152		
	},
	{
		symbol: 'trst.to',
		date: new Date('2020-12-30'),
		accountId: 51637118,
		action: 'sell',
		symbolId: 18521745,
		currency: 'cad',
		price: 0,
		quantity: 480,
		type: 'stock',
		hash: '',
		pnl: -4963.2		
	},
	{
		symbol: 'qbtc.u.to',
		date: new Date('2021-01-08'),
		accountId: 26418215,
		action: 'buy',
		symbolId: 30032314,
		currency: 'usd',
		price: 46,
		quantity: 512,
		type: 'stock',
		hash: '',
		pnl: 0
	},
	{
		symbol: 'scr.to',
		date: new Date('2021-10-22'),
		accountId: 51443858,
		action: 'sell',
		symbolId: 34561047,
		currency: 'cad',
		price: 44.65,
		quantity: 1492,
		type: 'stock',
		hash: '',
		pnl: 56361.27
	},
	{
		symbol: 'penn',
		date: new Date('2021-10-22'),
		accountId: 51443858,
		action: 'buy',
		symbolId: 31627,
		currency: 'usd',
		price: 74.63,
		quantity: 356,
		type: 'stock',
		hash: '',
		pnl: 0
	}
]);

export const filteredTrades = ['pm.vn'];

export const readTrades = (): ICloudTrade[] => {
	trades.forEach(q => {
		q.accountId = Number(q.accountId);
		q.symbol = changeSymbol(q.symbol.toLowerCase())
	});
	return trades.filter(q => !filteredTrades.includes(q.symbol)).concat(getCustomTrades());
};

export const addTrade = (trade: IQuestradeActivity): void => {
	if (!trade.symbol) {
		return;
	}

	const hash = crypto.createHash('md5').update(JSON.stringify(trade)).digest('hex');
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
		currency: trade.currency.toLowerCase() === 'usd' ? Currency.usd : Currency.cad,
		price,
		quantity: Math.abs(trade.quantity),
		type: trade.action.toLowerCase(),
		accountId: trade.accountId,
		hash,
		pnl: 0
	});

	tradesMap[hash] = true;
};

export const updateDividends = async (): Promise<void> => {
	await dividendsFile.save(JSON.stringify(dividends));
};

export const getDividends = async (): Promise<void> => {
	const data = await dividendsFile.download();
	// const data = fs.readFileSync('dividends.json', {encoding:'utf8', flag:'r'});
	dividends = JSON.parse(data[0].toString()).filter(d => !!d.amount);
	// const tcehy1 = dividends.find(d => d.amount === 18.15);
	// const tcehy2 = dividends.find(d => d.amount === 67.7);
	// if (tcehy1 && tcehy2) {
	// 	dividends = dividends.filter(d => d.amount !== 18.15 && d.amount !== 67.7);
	// 	dividends.push(tcehy1);
	// 	dividends.push(tcehy2);
	// 	console.log('fixed');
	// 	console.log(tcehy1);
	// 	console.log(tcehy2);
	// }
	dividends.forEach(dividend => {
		dividendsMap[dividend.hash] = true;
	});
};

export const addDividend = (dividend: IQuestradeActivity): void => {
	if (!dividend.symbol) {
		return;
	}

	const hash = crypto.createHash('md5').update(JSON.stringify(dividend)).digest('hex');
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
		accountId: dividend.accountId,
		hash
	});

	dividendsMap[hash] = true;
};

export const readDividends = (): ICloudDividend[] => {
	return dividends;
};

export const setProfitsAndLosses = (): void => {
	const cad: IProfitAndLose = { currency: Currency.cad, total: 0, combined: false};
	const usd: IProfitAndLose = { currency: Currency.usd, total: 0, combined: false};

	dividends.forEach(dividend => {
		const currency = dividend.currency === Currency.cad ? cad : usd;
		currency.total += dividend.amount;
	});

	const tradeTotals = {};
	const orderedTrades = _.orderBy(trades, t => t.date);
	orderedTrades.forEach(trade => {
		if (trade.action == 'buy') {
			tradeTotals[trade.symbol] = tradeTotals[trade.symbol] ||
				{ cost: 0, shares: 0, currency: trade.currency };
			tradeTotals[trade.symbol].cost += trade.price * trade.quantity;
			tradeTotals[trade.symbol].shares += trade.quantity;
		} else {
			if (tradeTotals[trade.symbol] && tradeTotals[trade.symbol].shares >= trade.quantity) {
				const totals = tradeTotals[trade.symbol];
				const avg = totals.cost / totals.shares;
				const cost = avg * trade.quantity;
				const proceeds = trade.price * trade.quantity;

				trade.pnl = proceeds - cost;

				totals.cost -= cost;
				totals.shares -= trade.quantity;

				const currency = totals.currency === Currency.cad ? cad : usd;
				currency.total += trade.pnl;
			} 
		}
	});

	profitsAndLosses = [cad, usd];
};

export const getProfitsAndLosses = (): IProfitAndLose[] => {
	return profitsAndLosses;
};
