import { Kraken } from 'node-kraken-api';
import { deferredPromise } from '../util';
import { Currency } from '../../../../src/utils/enum';

const initDeferredPromise = deferredPromise();

let key = '';
let secret = '';

export interface KrakenOpenOrder {
	pair?: string | null;
	type?: string | null;
	ordertype?: string | null;
	price?: string | null;
	price2?: string | null;
	leverage?: string | null;
	order?: string | null;
	close?: string | null;
	vol?: string | null;
}
export interface KrakenTrade {
	ordertxid?: string | null;
	pair?: string | null;
	time?: number | null;
	type?: string | null;
	ordertype?: string | null;
	price?: string | null;
	cost?: string | null;
	fee?: string | null;
	vol?: string | null;
	margin?: string | null;
	misc?: string | null;
	posstatus?: string | null;
	cprice?: string | null;
	ccost?: string | null;
	cfee?: string | null;
	cvol?: string | null;
	cmargin?: string | null;
	net?: string | null;
	trades?: Array<string> | null;
	trade_id: number;
}

interface KrakenReward {
	converted: string;
	native: string;
}

export interface KrakenEarnAllocation {
	native_asset: string;
	total_rewarded: KrakenReward;
	payout: {
		accumulated_reward: KrakenReward;
		estimated_reward: KrakenReward;
		period_end: string;
	};
	amount_allocated: {
		total: KrakenReward;
	};
}

interface KrakenEarnAllocations {
	items: KrakenEarnAllocation[];
}

export const init = (_key: string, _secret: string) => {
	key = _key;
	secret = _secret;
	initDeferredPromise.resolve();
};

const krakenPromise = new Promise<Kraken>(async (resolve) => {
	await initDeferredPromise.promise;
	let nonce = 0;
	const kraken = new Kraken({
		key,
		secret,
		gennonce: () => {
			nonce++;
			const time = Date.now() * 1000;
			return time + nonce;
		},
	});

	resolve(kraken);
});

export const getOpenOrders = async (): Promise<KrakenOpenOrder[]> => {
	const kraken = await krakenPromise;
	const result = await kraken.openOrders().catch((e) => {
		console.error(e);
	});
	if (!result) return [];
	const { open } = result;
	if (!open) return [];

	return Object.keys(open)
		.map((key) => ({ ...open[key].descr, vol: open[key].vol } as KrakenOpenOrder))
		.filter((q) => !q.pair?.match(/(cad|usd)_(cad|usd)/i));
};

export const getBalances = async () => {
	const kraken = await krakenPromise;
	const balance = await kraken.balance().catch((e) => console.error(e));
	if (!balance)
		return {
			usd: 0,
			cad: 0,
		};
	return {
		usd: Number(balance.ZUSD || 0),
		cad: Number(balance.ZCAD || 0),
	};
};

export const getTrades = async () => {
	const kraken = await krakenPromise;
	const now = Math.floor(Date.now() / 1000);
	const start = now - 60 * 60 * 24 * 30 * 2;
	console.log(`${start}:${now}`.yellow);
	const response = await kraken
		.tradesHistory({ start, end: now, trades: true })
		.catch((e) => console.error(e));
	if (!response?.trades) return [];
	const { trades } = response;
	return Object.keys(trades)
		.map((key) => ({
			...(trades[key] as KrakenTrade),
		}))
		.filter((q) => !q.pair?.match(/(usdc|usdt)/i));
};

export const getCurrencyAndSymbolFromPair = (pair: string) => {
	pair = pair.toLowerCase();
	let symbol = pair.replace(/(cad|usd)/, '');
	const currency = pair.replace(symbol, '') as Currency;

	symbol = symbol.replace(/(xxbtz)/, 'btc').replace(/(xethz)/, 'eth');

	return { symbol, currency };
};

export const getEarnAllocations = async (): Promise<KrakenEarnAllocation[]> => {
	const kraken = await krakenPromise;
	const response = await kraken
		.request('Earn/Allocations', null, 'private')
		.catch((e) => console.error(e));
	if (!response) return [];
	const { items } = response as KrakenEarnAllocations;
	return items;
};
