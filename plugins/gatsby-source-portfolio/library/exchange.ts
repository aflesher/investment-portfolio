import axios from 'axios';
import moment from 'moment-timezone';

import { setExchangeRate } from './firebase';
import { IExchangeRate } from '../../../declarations';
import { deferredPromise } from './util';

let api = '';
let appId = '';

const lookupDeferredPromise = deferredPromise<{ [key: string]: number }>();
const todaysPriceDeferredPromise = deferredPromise<number>();

const checkEnvExchangeRate = async () => {
	const rate = process.env.USD_CAD;
	if (!rate) {
		return;
	}

	return setExchangeRate('USD_CAD', moment().format('YYYY-MM-DD'), Number(rate));
};

export const init = (_api: string, _appId: string): void => {
	api = _api;
	appId = _appId;
	checkEnvExchangeRate();
};

export const loadTodaysRate = async (): Promise<number | null> => {
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

	await setExchangeRate('USD_CAD', moment().format('YYYY-MM-DD'), Number(rate));

	return resp.data.rates.CAD;
};

export const setExchangeRates = (exchangeRates: IExchangeRate[]) => {
	const lookup: { [key: string]: number } = {};
	exchangeRates.forEach(({ rate, date }) => {
		lookup[date] = rate;
	});

	lookupDeferredPromise.resolve(lookup);
};

export const getExchangeRates = (): Promise<{ [key: string]: number }> =>
	lookupDeferredPromise.promise;

export const getTodaysRate = (): Promise<number> => {
	return todaysPriceDeferredPromise.promise;
};
