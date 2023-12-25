import axios from 'axios';
import moment from 'moment-timezone';

import * as firebase from './firebase';
import { IExchangeRate } from '../../../declarations';
import { deferredPromise } from './util';

let api = '';
let appId = '';

const lookupDeferredPromise = deferredPromise<{ [key: string]: number }>();
const todaysPriceDeferredPromise = deferredPromise<number>();

const checkEnvExchangeRate = async () => {
	const rate = process.env.USD_CAD;
	if (!rate) {
		return false;
	}

	await firebase.setExchangeRate(
		'USD_CAD',
		moment().format('YYYY-MM-DD'),
		Number(rate)
	);
	todaysPriceDeferredPromise.resolve(Number(rate));
	return true;
};

const loadTodaysRate = async (): Promise<number | null> => {
	const resp = await axios
		.get(`${api}latest.json`, {
			params: {
				app_id: appId,
				base: 'USD',
			},
		})
		.catch(console.log);

	if (!resp) {
		return null;
	}

	const rate = resp.data.rates.CAD;
	todaysPriceDeferredPromise.resolve(rate);

	await firebase.setExchangeRate(
		'USD_CAD',
		moment().format('YYYY-MM-DD'),
		Number(rate)
	);

	return resp.data.rates.CAD;
};

const createLookup = (exchangeRates: IExchangeRate[]) => {
	const lookup: { [key: string]: number } = {};
	exchangeRates.forEach(({ rate, date }) => {
		lookup[date] = rate;
	});

	lookupDeferredPromise.resolve(lookup);
};

export const init = async (_api: string, _appId: string) => {
	console.log('exchange.init (start)'.gray);
	api = _api;
	appId = _appId;
	const todaysRateSet = await checkEnvExchangeRate();
	if (!todaysRateSet) {
		await loadTodaysRate();
	}

	const exchangeRates = await firebase.getExchangeRates();
	createLookup(exchangeRates);
	console.log('exchange.init (end)'.gray);
};

export const getExchangeRates = (): Promise<{ [key: string]: number }> =>
	lookupDeferredPromise.promise;

export const getTodaysRate = (): Promise<number> => {
	return todaysPriceDeferredPromise.promise;
};
