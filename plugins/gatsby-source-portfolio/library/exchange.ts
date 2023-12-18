import axios from 'axios';
import moment from 'moment-timezone';

import { setExchangeRate } from './firebase';
import { IExchangeRate } from '../../../declarations';
import { deferredPromise } from './util';

let api = '';
let appId = '';

const lookupDeferredPromise = deferredPromise<{ [key: string]: number }>();

export const init = (_api: string, _appId: string): void => {
	api = _api;
	appId = _appId;
};

export const getTodaysRate = async (): Promise<number | null> => {
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

export const getExchangeRates = async (): Promise<{ [key: string]: number }> =>
	lookupDeferredPromise.promise;
