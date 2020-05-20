import axios from 'axios';
import _ from 'lodash';
import moment from 'moment-timezone';

import { getExchangeRate, setExchangeRate }  from './firebase';

let api = '';
let apiKey = '';

export const init = (_api: string, _apiKey: string): void => {
	api = _api;
	apiKey = _apiKey;
};

export const getRate = async (from, to, date): Promise<number> => {
	const key = `${from.toUpperCase()}_${to.toUpperCase()}`;
	date = moment(date).startOf('day').toDate();
	const dateString = moment(date).format('YYYY-MM-DD');

	const rateInfo = await getExchangeRate(key, date);
	if (rateInfo) {
		return rateInfo.rate;
	}

	if (date <= moment().startOf('day').subtract(1, 'year').toDate()) {
		return null;
	}

	const resp = await axios.get(api, {
		params: {
			q: key,
			compact: 'ultra',
			apiKey,
			date: dateString
		}
	}).catch(console.log);

	if (!resp) {
		return 1;
	}

	const rate = resp.data[key][dateString];

	await setExchangeRate(key, date, rate);

	return rate;
};
