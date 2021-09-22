import axios from 'axios';
import _ from 'lodash';
import moment from 'moment-timezone';

import { setExchangeRate } from './firebase';

let api = '';
let apiKey = '';

export const init = (_api: string, _apiKey: string): void => {
	api = _api;
	apiKey = _apiKey;
};

export const getRate = async (from: string, to: string, date: string): Promise<number> => {
	const key = `${from.toUpperCase()}_${to.toUpperCase()}`;

	// This is a restriction of the endpoint. I think you'll need to manually backfill
	if (moment(date).toDate() <= moment().startOf('day').subtract(1, 'year').toDate()) {
		console.error(date, '    is missing for rates');
		return 1;
	}

	const resp = await axios
		.get(api, {
			params: {
				q: key,
				compact: 'ultra',
				apiKey,
				date,
			},
		})
		.catch(console.log);

	if (!resp) {
		return 1;
	}

	const rate = resp.data[key][date];

	await setExchangeRate(key, date, rate);

	return rate;
};
