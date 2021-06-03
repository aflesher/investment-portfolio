import admin from 'firebase-admin';
import _ from 'lodash';

import { deferredPromise } from './util';
import { IAssessment } from '../../../src/utils/assessment';
import { IExchangeRate } from '../../../src/utils/exchange';
import { IPosition } from '../../../src/utils/position';
import { Currency, AssetType } from '../../../src/utils/enum';
import { IReview } from '../../../src/utils/review';
import { ITrade } from '../../../src/utils/trade';

const serviceAccount = require('../json/firebase.json');
let firestore;
let questradeAuthDocumentSnapshot;
let stateDocumentSnapshot;

const initDeferredPromise = deferredPromise();

interface IQuestradeAuth {
	accessToken: string,
	apiUrl: string,
	expiryTime: number,
	refreshToken: string
}

interface IState {
	questradeActivityDate: {
		_seconds: number
	} | Date
}

export const init = (config: object): void => {
	const account = { ...serviceAccount, ...config };
	const firebase = admin.initializeApp({
		credential: admin.credential.cert(account),
		databaseURL: 'https://dollar-jockey-5d690.firebaseio.com',
		storageBucket: 'gs://dollar-jockey-5d690.appspot.com'
	});

	firestore = firebase.firestore();

	initDeferredPromise.resolve();
};

export const getAssessments = async (): Promise<IAssessment[]> => {
	await initDeferredPromise.promise;
	
	const querySnapshot = await firestore
		.collection('stocks')
		.get();
	
	return querySnapshot.docs.map(documentSnapshot => {
		const doc = documentSnapshot.data();
		doc.lastUpdatedTimestamp = doc.lastUpdated ? doc.lastUpdated._seconds * 1000 : 0;
		if (!Array.isArray(doc.notes)) {
			doc.notes = _.filter([doc.notes]);
		}
		doc.questions = doc.questions || [];
		doc.targetInvestment = doc.targetInvestment || 0;
		doc.targetPrice = doc.targetPrice || 0;
		doc.valuations = doc.valuations || [];
		return _.omit(doc, 'lastUpdated');
	});
};

export const setAssessment = async (assessment: IAssessment): Promise<void> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('stocks')
		.where('symbol', '==', assessment.symbol)
		.get();

	_.forEach(querySnapshot.docs, queryDocumentSnapshot => {
		queryDocumentSnapshot.ref.set(assessment, {merge: true});
	});
};

export const getExchangeRates = async (): Promise<IExchangeRate[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('exchange')
		.get();
	
	return querySnapshot.docs.map(documentSnapshot => documentSnapshot.data());
};

export const setExchangeRates = async (key: string, value: number): Promise<void> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('exchange')
		.where('key', '==', key)
		.get();
	
	_.forEach(querySnapshot.docs, queryDocumentSnapshot => {
		queryDocumentSnapshot.ref.set({
			value,
			updated: new Date()
		}, {merge: true});
	});
};

export interface IFirebaseNote {
	text: string
}

export const getNotes = async (): Promise<IFirebaseNote[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('notes')
		.get();

	return querySnapshot.docs.map(documentSnapshot => documentSnapshot.data());
};

export const getQuestradeAuth = async (): Promise<IQuestradeAuth> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('questradeAuth')
		.get();

	questradeAuthDocumentSnapshot = querySnapshot.docs[0];

	return questradeAuthDocumentSnapshot.data();
};

export const setQuestradeAuth = async (
	refreshToken: string, accessToken: string, expiryTime: number, apiUrl: string
): Promise<void> => {
	await initDeferredPromise.promise;

	questradeAuthDocumentSnapshot.ref.set({
		refreshToken, accessToken, expiryTime, apiUrl
	});
};

export const getState = async (): Promise<IState> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('state')
		.get();

	stateDocumentSnapshot = querySnapshot.docs[0];

	return stateDocumentSnapshot.data();
};

export const getQuestradeActivityDate = async (): Promise<number> => {
	const state = await getState();
	return (state.questradeActivityDate as {_seconds: number})._seconds * 1000;
};

export const setQuestradeActivityDate = async (questradeActivityDate: Date): Promise<void> => {
	await initDeferredPromise.promise;

	stateDocumentSnapshot.ref.set({
		questradeActivityDate
	});
};

export const setExchangeRate = async (key: string, date: Date, rate: number): Promise<void> => {
	await initDeferredPromise.promise;

	const docRef = await firestore
		.collection('exchange')
		.doc();
	
	await docRef.set({
		rate,
		date,
		key
	});
};

export const getExchangeRate = async (key: string, date: Date): Promise<IExchangeRate | null> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('exchange')
		.where('key', '==', key)
		.where('date', '==', date)
		.get();
	
	if (querySnapshot.docs.length == 0) {
		return null;
	}

	return querySnapshot.docs[0].data();
};

interface ICryptoPositionDoc {
	averageEntryPrice: number,
	quantity: number,
	symbol: string,
	totalCost: number
}

export interface ICryptoPosition extends Pick<IPosition, 'currency' | 'type' |
'averageEntryPrice' | 'quantity' | 'symbol' | 'totalCostCad' > {}

export const getCryptoPositions = async (): Promise<ICryptoPosition[]> =>
{
	await initDeferredPromise.promise;
	
	const querySnapshot = await firestore
		.collection('cryptoPositions')
		.get();
	
	return querySnapshot.docs.map(documentSnapshot => {
		const doc: ICryptoPositionDoc = documentSnapshot.data();
		return {
			currency: Currency.cad,
			type: AssetType.crypto,
			averageEntryPrice: doc.averageEntryPrice,
			quantity: doc.quantity,
			symbol: doc.symbol,
			totalCostCad: doc.totalCost
		};
	});
};

interface ICryptoTradeDoc {
	symbol: string,
	isSell: boolean,
	quantity: number,
	price: number,
	timestamp: {
		_seconds: number,
		_nanoseconds: number
	}
}

export const calculateCryptoPositions = (trades: ICryptoTrade[]): ICryptoPosition[] => {
	const orderedTrades = _.orderBy(trades, t => t.timestamp);

	const positions: ICryptoPosition[] = [];
	_.forEach(orderedTrades, t => {
		let position = _.find(positions, p => p.symbol === t.symbol);
		// if it's a sell and we don't have a position we can just return (bad state)
		if (t.isSell && !position) {
			console.log(`skipping ${t.symbol} ${new Date(t.timestamp)}`);
			return;
		}

		// first buy
		if (!position) {
			position = {
				currency: Currency.cad,
				type: AssetType.crypto,
				symbol: t.symbol,
				averageEntryPrice: t.price,
				quantity: t.quantity,
				totalCostCad: t.price * t.quantity
			};
			positions.push(position);
			return;
		}

		// buy
		if (!t.isSell) {
			position.totalCostCad += t.quantity * t.price;
			position.quantity += t.quantity;
			position.averageEntryPrice = position.totalCostCad / position.quantity;
			return;
		}

		// sell
		position.quantity = Math.max(position.quantity - t.quantity, 0);
		position.totalCostCad = Math.max(position.quantity * position.averageEntryPrice, 0);
	});

	return _.filter(positions, p => p.quantity > 0 && p.totalCostCad > 0);
}

export interface ICryptoTrade extends
	Pick<ITrade, 'symbol' | 'timestamp' | 'isSell' | 'quantity' | 'price' | 'type' | 'pnl'> {}

export const getCryptoTrades = async(): Promise<ICryptoTrade[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('cryptoTrades')
		.get();
	
	const trades =  querySnapshot.docs.map(documentSnapshot => {
		const doc: ICryptoTradeDoc = documentSnapshot.data();
		return {
			currency: Currency.cad,
			type: AssetType.crypto,
			price: doc.price,
			quantity: doc.quantity,
			symbol: doc.symbol,
			isSell: doc.isSell,
			timestamp: doc.timestamp._seconds * 1000,
			pnl: 0
		};
	});

	setCryptoTradeGainsAndLosses(trades);

	return trades;
};

export const setCryptoTradeGainsAndLosses = (trades: ICryptoTrade[]) => {
	const tradeTotals: {
		[symbol: string]: { cost: number; shares: number };
	} = {};
	const orderedTrades = _.orderBy(trades, (t) => t.timestamp);
	orderedTrades.forEach((trade) => {
		if (!trade.isSell) {
			tradeTotals[trade.symbol] = tradeTotals[trade.symbol] || {
				cost: 0,
				shares: 0,
			};
			tradeTotals[trade.symbol].cost += trade.price * trade.quantity;
			tradeTotals[trade.symbol].shares += trade.quantity;
		} else {
			if (
				tradeTotals[trade.symbol] &&
				tradeTotals[trade.symbol].shares >= trade.quantity
			) {
				const totals = tradeTotals[trade.symbol];
				const avg = totals.cost / totals.shares;
				const cost = avg * trade.quantity;
				const proceeds = trade.price * trade.quantity;
	
				trade.pnl = proceeds - cost;
				totals.cost -= cost;
				totals.shares -= trade.quantity;
			}
		}
	});
};

export const getReviews = async (): Promise<IReview[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('reviews')
		.get();
	
	return querySnapshot.docs.map(documentSnapshot => documentSnapshot.data());
};