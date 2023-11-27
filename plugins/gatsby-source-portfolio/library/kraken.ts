import { Kraken } from 'node-kraken-api';
import { deferredPromise } from './util';

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

	return Object.keys(open).map(
		(key) => ({ ...open[key].descr, vol: open[key].vol } as KrakenOpenOrder)
	);
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
