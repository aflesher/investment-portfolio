import _ from 'lodash';
import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';

import * as api from './api';

// Creates a client
const storage = new Storage({
	keyFilename: './key.json',
});
const bucket = storage.bucket('dollar-jockey-5d690.appspot.com');
const tradesFile = bucket.file('kraken-trades.json');

let trades: api.KrakenTrade[] = [];
const tradesMap = {};

const getHash = (trade: api.KrakenTrade): string =>
	crypto.createHash('md5').update(JSON.stringify(trade)).digest('hex');

const addTrade = (trade: api.KrakenTrade): void => {
	const hash = getHash(trade);

	if (tradesMap[hash]) {
		return;
	}

	trades.push(trade);
	tradesMap[hash] = true;
};

const loadTrades = async (): Promise<void> => {
	const data = await tradesFile.download();
	trades = JSON.parse(data[0].toString());
	_.forEach(trades, (trade) => {
		tradesMap[getHash(trade)] = true;
	});
};

const updateTrades = async (): Promise<void> => {
	await tradesFile.save(JSON.stringify(trades));
};

export const sync = async (fetchedTrades: api.KrakenTrade[]): Promise<void> => {
	console.log('kraken.sync (start)'.gray);

	// load from the cloud
	await loadTrades().catch(console.log);

	// fetch all new activities and add to memory
	_.forEach(fetchedTrades, addTrade);

	// write back to the cloud
	await updateTrades().catch(console.log);
	console.log('questrade.sync (end)'.gray);
};

export const getTrades = (): api.KrakenTrade[] => {
	return trades;
};
