import admin from 'firebase-admin';
import _ from 'lodash';
import firebase from 'firebase/compat/app';
import NP from 'number-precision';
import 'colors';

import { deferredPromise } from './util';
import {
	IAssessment,
	IExchangeRate,
	IReview,
	ITrade,
	ICash,
	IStockSplit,
	ICryptoPosition,
} from '../../../declarations';
import { Currency, AssetType } from '../../../src/utils/enum';
import moment from 'moment';
import { IEarningsDate } from './earnings-calendar';
import { ICrypto52Weeks } from './crypto';

const DEBUG_CRYPTO_POSITIONS: string[] = [];

const serviceAccount = require('../json/firebase.json');
let firestore: FirebaseFirestore.Firestore;
let questradeAuthDocumentSnapshot;
let stateDocumentSnapshot;

const initDeferredPromise = deferredPromise();

interface IQuestradeAuth {
	accessToken: string;
	apiUrl: string;
	expiryTime: number;
	refreshToken: string;
}

interface IState {
	questradeActivityDate:
		| {
				_seconds: number;
		  }
		| Date;
}

export const init = (config: object): void => {
	const account = { ...serviceAccount, ...config };
	const firebase = admin.initializeApp({
		credential: admin.credential.cert(account),
		databaseURL: 'https://dollar-jockey-5d690.firebaseio.com',
		storageBucket: 'gs://dollar-jockey-5d690.appspot.com',
	});

	firestore = firebase.firestore();

	console.log('firebase.init (resolve)'.gray);
	initDeferredPromise.resolve();
};

export const getAssessments = async (): Promise<IAssessment[]> => {
	console.log('getAssessments (start)'.gray);
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('stocks').get();

	const results = querySnapshot.docs.map((documentSnapshot) => {
		const doc = documentSnapshot.data();
		doc.lastUpdatedTimestamp = doc.lastUpdated
			? doc.lastUpdated._seconds * 1000
			: 0;
		if (!Array.isArray(doc.notes)) {
			doc.notes = _.filter([doc.notes]);
		}
		doc.questions = doc.questions || [];
		doc.targetInvestment = doc.targetInvestment || 0;
		doc.targetPrice = doc.targetPrice || 0;
		doc.valuations = doc.valuations || [];
		doc.rating = doc.rating || 'none';
		return _.omit(doc, 'lastUpdated') as IAssessment;
	});

	console.log('getAssessments (end)'.gray);
	return results;
};

export const setAssessment = async (assessment: IAssessment): Promise<void> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('stocks')
		.where('symbol', '==', assessment.symbol)
		.get();

	_.forEach(querySnapshot.docs, (queryDocumentSnapshot) => {
		queryDocumentSnapshot.ref.set(assessment, { merge: true });
	});
};

export const getExchangeRates = async (): Promise<IExchangeRate[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('exchangeRates').get();

	return querySnapshot.docs.map(
		(documentSnapshot) => documentSnapshot.data() as IExchangeRate
	);
};

export interface IFirebaseNote {
	text: string;
}

export const getNotes = async (): Promise<IFirebaseNote[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('notes').get();

	return querySnapshot.docs.map(
		(documentSnapshot) => documentSnapshot.data() as IFirebaseNote
	);
};

export const getQuestradeAuth = async (): Promise<IQuestradeAuth> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('questradeAuth').get();

	questradeAuthDocumentSnapshot = querySnapshot.docs[0];

	return questradeAuthDocumentSnapshot.data();
};

export const setQuestradeAuth = async (
	refreshToken: string,
	accessToken: string,
	expiryTime: number,
	apiUrl: string
): Promise<void> => {
	await initDeferredPromise.promise;

	questradeAuthDocumentSnapshot.ref.set({
		refreshToken,
		accessToken,
		expiryTime,
		apiUrl,
	});
};

export const getState = async (): Promise<IState> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('state').get();

	stateDocumentSnapshot = querySnapshot.docs[0];

	return stateDocumentSnapshot.data();
};

export const getQuestradeActivityDate = async (): Promise<number> => {
	const state = await getState();
	return (state.questradeActivityDate as { _seconds: number })._seconds * 1000;
};

export const setQuestradeActivityDate = async (
	questradeActivityDate: Date
): Promise<void> => {
	await initDeferredPromise.promise;

	stateDocumentSnapshot.ref.set({
		questradeActivityDate,
	});
};

export const setExchangeRate = async (
	key: string,
	date: string,
	rate: number
): Promise<void> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('exchangeRates')
		.where('key', '==', key)
		.where('date', '==', date)
		.get();

	if (querySnapshot.docs.length) {
		console.log('rate already exists for', date);
		return;
	}

	const docRef = await firestore.collection('exchangeRates').doc();

	await docRef.set({
		rate,
		date,
		key,
	});
};

export const updateExchangeRates = async (): Promise<void> => {
	const querySnapshot = await firestore.collection('exchange').get();

	querySnapshot.docs.forEach(async (doc) => {
		const data = doc.data();
		console.log(
			'iteration',
			moment(data.date._seconds * 1000).format('YYYY-MM-DD')
		);

		const docRef = await firestore.collection('exchangeRates').doc();

		await docRef.set({
			rate: data.rate,
			key: data.key,
			date: moment(data.date._seconds * 1000).format('YYYY-MM-DD'),
		});
	});
};

interface ICryptoTradeDoc {
	symbol: string;
	isSell: boolean;
	quantity: number;
	price: number;
	priceCad: number;
	priceUsd: number;
	timestamp: {
		_seconds: number;
		_nanoseconds: number;
	};
}

const debugCryptoPosition = (
	trade: ICryptoTrade,
	position: ICryptoPosition
) => {
	if (!DEBUG_CRYPTO_POSITIONS.includes(trade.symbol)) {
		return;
	}

	console.log('<<<<<<<<<<<<'.yellow);
	console.log(trade);
	console.log(position);
	console.log('>>>>>>>>>>>>'.yellow);
};

export const calculateCryptoPositions = (
	trades: ICryptoTrade[],
	rates: IExchangeRate[]
): ICryptoPosition[] => {
	const orderedTrades = _.orderBy(trades, (t) => t.timestamp);
	const ratesMap = _.keyBy(rates, (r) => r.date);

	const positions: ICryptoPosition[] = [];
	_.forEach(orderedTrades, (t) => {
		let position = _.find(positions, (p) => p.symbol === t.symbol);
		const rate = ratesMap[moment(t.timestamp).format('YYYY-MM-DD')];
		if (!rate) {
			console.log(`missing rate for ${t.symbol} ${new Date(t.timestamp)}`);
			return;
		}
		// if it's a sell and we don't have a position we can just return (bad state)
		if (t.isSell && !position) {
			console.log(`skipping ${t.symbol} ${new Date(t.timestamp)}`);
			return;
		}

		// first buy
		if (!position) {
			position = {
				currency: Currency.usd,
				type: AssetType.crypto,
				symbol: t.symbol,
				averageEntryPrice: t.price,
				averageEntryPriceCad: t.price * rate.rate,
				quantity: t.quantity,
				totalCostUsd: t.price * t.quantity,
				totalCostCad: t.price * t.quantity * rate.rate,
			};
			positions.push(position);
			debugCryptoPosition(t, position);
			return;
		}

		// buy
		if (!t.isSell) {
			position.totalCostCad += t.quantity * t.price * rate.rate;
			position.totalCostUsd += t.quantity * t.price;
			position.quantity += t.quantity;
			position.averageEntryPrice = position.totalCostUsd / position.quantity;
			position.averageEntryPriceCad = position.totalCostCad / position.quantity;
			debugCryptoPosition(t, position);
			return;
		}

		// sell
		position.quantity = Math.max(position.quantity - t.quantity, 0);
		if (position.quantity < 0.001) {
			position.quantity = 0;
		}
		position.totalCostCad = Math.max(
			position.quantity * position.averageEntryPriceCad,
			0
		);
		position.totalCostUsd = Math.max(
			position.quantity * position.averageEntryPrice,
			0
		);
		debugCryptoPosition(t, position);
	});

	return _.filter(positions, (p) => p.quantity > 0 && p.totalCostCad > 0);
};

export interface ICryptoTrade
	extends Pick<
		ITrade,
		'symbol' | 'timestamp' | 'isSell' | 'quantity' | 'price' | 'type' | 'pnl'
	> {}

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
			tradeTotals[trade.symbol].shares = NP.plus(
				tradeTotals[trade.symbol].shares,
				trade.quantity
			);
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
				totals.shares = NP.minus(totals.shares, trade.quantity);
			}
		}
	});
};

export const getCryptoTrades = async (): Promise<ICryptoTrade[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('cryptoTrades').get();

	const trades = querySnapshot.docs.map((documentSnapshot) => {
		const doc: ICryptoTradeDoc = documentSnapshot.data() as ICryptoTradeDoc;
		return {
			currency: Currency.usd,
			type: AssetType.crypto,
			price: doc.price,
			quantity: doc.quantity,
			symbol: doc.symbol,
			isSell: doc.isSell,
			timestamp: doc.timestamp._seconds * 1000,
			pnl: 0,
		};
	});

	setCryptoTradeGainsAndLosses(trades);

	return trades;
};

export const getReviews = async (): Promise<IReview[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('reviews').get();

	return querySnapshot.docs.map(
		(documentSnapshot) => documentSnapshot.data() as IReview
	);
};

interface ICryptoMetaDataDoc extends firebase.firestore.DocumentData {
	symbol: string;
	oneYearLowUsd: number;
	oneYearHighUsd: number;
}

export interface ICryptoMetaData extends ICryptoMetaDataDoc {}

export const checkAndUpdateEarningsDates = async (
	earningsDates: IEarningsDate[]
) => {
	await initDeferredPromise.promise;

	await Promise.all(
		earningsDates.map(async ({ symbol, timestamp }) => {
			await firestore
				.collection('earningsDates')
				.doc(symbol)
				.set({ timestamp }, { merge: true });
		})
	);
};

interface IEarningsDateData extends Omit<IEarningsDate, 'symbol'> {}

export const getEarningsDates = async (): Promise<IEarningsDate[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('earningsDates').get();

	const dates = await Promise.all(
		querySnapshot.docs.map(async (documentSnapshot) => {
			const {
				timestamp,
			}: IEarningsDateData = documentSnapshot.data() as IEarningsDateData;
			return { symbol: documentSnapshot.id, timestamp };
		})
	);

	return dates;
};

export const getStockSplits = async (): Promise<IStockSplit[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('stockSplit').get();

	const data = await Promise.all(
		querySnapshot.docs.map(async (documentSnapshot) => {
			const {
				isApplied,
				isReverse,
				symbol,
				ratio,
				date,
			}: IStockSplit = documentSnapshot.data() as IStockSplit;

			return { isApplied, isReverse, symbol, ratio, date };
		})
	);

	return data;
};

export const updateStockSplit = async (
	stockSplit: IStockSplit
): Promise<boolean> => {
	await initDeferredPromise.promise;

	const { symbol, date } = stockSplit;

	const querySnapshot = await firestore
		.collection('stockSplit')
		.where('symbol', '==', symbol)
		.where('date', '==', date)
		.get();

	if (!querySnapshot.docs.length) {
		return false;
	}

	const documentSnapshot = querySnapshot.docs[0];
	await documentSnapshot.ref.set(stockSplit, { merge: true });
	return true;
};

interface IFirebaseCash extends Omit<ICash, 'amountCad' | 'amountUsd'> {}

export const getCash = async (): Promise<IFirebaseCash[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('cash').get();

	const data = await Promise.all(
		querySnapshot.docs.map(async (documentSnapshot) => {
			const {
				currency,
				amount,
				accountId,
				accountName,
			}: IFirebaseCash = documentSnapshot.data() as IFirebaseCash;

			return { currency, amount, accountId, accountName };
		})
	);

	return data;
};

export const checkAndUpdateCryptoMetaData = async (
	crypto52WeeksPromise: Promise<ICrypto52Weeks[]>
) => {
	await initDeferredPromise.promise;
	const crypto52Weeks = await crypto52WeeksPromise;

	const querySnapshot = await firestore.collection('cryptoMetaData').get();

	return querySnapshot.docs.map(async (documentSnapshot) => {
		const data: ICryptoMetaDataDoc = documentSnapshot.data() as ICryptoMetaDataDoc;

		const crypto52Week = crypto52Weeks.find((q) => q.symbol === data.symbol);
		if (crypto52Week && crypto52Week.high && crypto52Week.low) {
			data.oneYearHighUsd = crypto52Week.high;
			data.oneYearLowUsd = crypto52Week.low;
			await documentSnapshot?.ref?.set(data, { merge: true });
		}
	});
};

export const getCryptoMetaData = async (): Promise<ICryptoMetaData[]> => {
	console.log('firebase.getCryptoMetaData (start)'.gray);
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('cryptoMetaData').get();

	const results = querySnapshot.docs.map((documentSnapshot) => {
		const {
			symbol,
			oneYearHighUsd,
			oneYearLowUsd,
		}: ICryptoMetaDataDoc = documentSnapshot.data() as ICryptoMetaDataDoc;

		const data: ICryptoMetaData = {
			symbol,
			oneYearHighUsd,
			oneYearLowUsd,
		};

		return data;
	});

	console.log('firebase.getCryptoMetaData (end)'.gray);
	return results;
};

export const updateCryptoTrades = async (): Promise<void> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('cryptoTrades').get();

	querySnapshot.docs.map((documentSnapshot) => {
		const doc: ICryptoTradeDoc = documentSnapshot.data() as ICryptoTradeDoc;
		doc.price = doc.priceUsd;
		documentSnapshot.ref.set(doc, { merge: true });
	});
};

export const getHisaStocks = async (): Promise<{ symbol: string }[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('stockHisa').get();

	const dates = await Promise.all(
		querySnapshot.docs.map(async (documentSnapshot) => {
			return { symbol: documentSnapshot.id };
		})
	);

	return dates;
};
