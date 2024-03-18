import _ from 'lodash';
import { Storage } from '@google-cloud/storage';

import * as api from './api';

// Creates a client
const storage = new Storage({
	keyFilename: './key.json',
});
const bucket = storage.bucket('dollar-jockey-5d690.appspot.com');
const tradesFile = bucket.file('kraken-trades.json');

let trades: api.KrakenTrade[] = [];
const tradesMap: { [key: number]: boolean } = {};

const addTrade = (trade: api.KrakenTrade): void => {
	const tradeId = trade.trade_id;

	if (tradesMap[tradeId]) {
		return;
	}

	trades.push(trade);
	tradesMap[tradeId] = true;
};

const loadTrades = async (): Promise<void> => {
	const data = await tradesFile.download();
	trades = JSON.parse(data[0].toString());
	_.forEach(trades, (trade) => {
		tradesMap[trade.trade_id] = true;
	});
};

const updateTrades = async (): Promise<void> => {
	await tradesFile.save(JSON.stringify(trades));
};

export const sync = async (fetchedTrades: api.KrakenTrade[]): Promise<void> => {
	console.log('kraken.sync (start)'.gray);
	console.log('fetched kraken trades', fetchedTrades.length);

	// load from the cloud
	await loadTrades().catch(console.log);
	console.log('cloud kraken trades', trades.length);

	// fetch all new activities and add to memory
	_.forEach(fetchedTrades, addTrade);

	console.log('total kraken trades', trades.length);
	// write back to the cloud
	await updateTrades().catch(console.log);
	console.log('kraken.sync (end)'.gray);
};

export const getTrades = (): api.KrakenTrade[] => {
	return trades;
};
