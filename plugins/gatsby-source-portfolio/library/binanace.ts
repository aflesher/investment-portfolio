import axios from 'axios';
import _ from 'lodash';
import moment from 'moment';
import crypto from 'crypto';

import { deferredPromise } from './util';
import { URLSearchParams } from 'url';

const initDeferredPromise = deferredPromise();

export interface IBinanceOrder {
	symbol: string,
	orderId: number,
	orderListId: number, //Unless OCO, the value will always be -1
	clientOrderId: string,
	price: string,
	origQty: string,
	executedQty: string,
	cummulativeQuoteQty: string,
	status: string,
	timeInForce: string,
	type: 'LIMIT' | 'MARKET',
	side: 'BUY' | 'SELL',
	stopPrice: string,
	icebergQty: string,
	time: number,
	updateTime: number,
	isWorking: boolean,
	origQuoteOrderQty: string
}

let api = '';
let apiKey = '';
let secretKey = '';

export const init = (_api: string, _apiKey: string, _secretKey: string): void => {
	api = _api;
	apiKey = _apiKey;
	secretKey = _secretKey;

	initDeferredPromise.resolve();
};

const getSignature = (params: {}): string => {
	const queryString = new URLSearchParams(params).toString();
	return crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
};

export const getOpenOrders = async (): Promise<IBinanceOrder[]> => {
	await initDeferredPromise.promise;
	const timestamp = moment().unix() * 1000;
	const params = {
		timestamp
	};
	const signature = getSignature(params);
	const resp = await axios.get(`${api}/api/v3/openOrders`, {
		headers: {
			'X-MBX-APIKEY': apiKey,
			'Accept': 'application/json'
		},
		params: { ...params, signature }
	}).catch(console.log);

	if (!resp) {
		return [];
	}

	return resp.data;
};
