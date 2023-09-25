import axios from 'axios';
import _ from 'lodash';
import moment from 'moment-timezone';

import { setExchangeRate } from './firebase';

let api = '';
let appId = '';

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
