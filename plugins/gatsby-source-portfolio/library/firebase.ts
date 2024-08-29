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
	IStockSplit,
	ITrade,
	IPosition,
	IAccount,
	IQuote,
	IOrder,
} from '../../../declarations';
import { Currency, AssetType } from '../../../src/utils/enum';
import moment from 'moment';
import { IEarningsDate } from './earnings-calendar';
import { ICrypto52Weeks } from './crypto';
import {
	getExchangeRates as getExchangeLookup,
	getTodaysRate,
} from './exchange';

interface ICryptoPosition
	extends Pick<
		IPosition,
		| 'currency'
		| 'type'
		| 'averageEntryPrice'
		| 'quantity'
		| 'symbol'
		| 'totalCostCad'
	> {
	averageEntryPriceCad: number;
	totalCostUsd: number;
}

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

export interface ICryptoTrade
	extends Pick<
		ITrade,
		'symbol' | 'timestamp' | 'isSell' | 'quantity' | 'price' | 'type' | 'pnl'
	> {}

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

	return trades;
};

export const getTrades = async (): Promise<ITrade[]> => {
	const cryptoTrades = await getCryptoTrades();

	const ratesLookup = await getExchangeLookup();

	const trades: ITrade[] = cryptoTrades.map((trade) => {
		const usdToCadRate =
			ratesLookup[moment(trade.timestamp).format('YYYY-MM-DD')];
		return {
			isSell: trade.isSell,
			symbol: trade.symbol,
			priceCad: trade.price * usdToCadRate,
			priceUsd: trade.price,
			timestamp: trade.timestamp,
			pnl: trade.pnl,
			pnlCad: trade.pnl * usdToCadRate,
			pnlUsd: trade.pnl,
			currency: Currency.usd,
			price: trade.price,
			quantity: trade.quantity,
			action: trade.isSell ? 'sell' : 'buy',
			type: AssetType.crypto,
			taxable: true,
			accountId: 'binance',
			accountPnl: 0,
			accountPnlCad: 0,
			accountPnlUsd: 0,
		};
	});

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
		earningsDates.map(async ({ symbol, date }) => {
			await firestore
				.collection('earnings')
				.doc(symbol)
				.set({ date }, { merge: true });
		})
	);
};

interface IEarningsDateData extends Omit<IEarningsDate, 'symbol'> {}

export const getEarningsDates = async (): Promise<IEarningsDate[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('earnings').get();

	const dates = await Promise.all(
		querySnapshot.docs.map(async (documentSnapshot) => {
			const {
				date,
			}: IEarningsDateData = documentSnapshot.data() as IEarningsDateData;
			return { symbol: documentSnapshot.id, date };
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

export const updateCrypto52WeekHigh = async (quotes: IQuote[]) => {
	const querySnapshot = await firestore.collection('cryptoMetaData').get();

	return querySnapshot.forEach(async (doc) => {
		const documentRef = firestore.collection('cryptoMetaData').doc(doc.id);
		const data: ICryptoMetaDataDoc = doc.data() as ICryptoMetaDataDoc;

		const quote = quotes.find((q) => q.symbol === data.symbol);
		if (!quote || quote.price < data.oneYearHighUsd) {
			return;
		}

		documentRef.set({ oneYearHighUsd: quote.price }, { merge: true });
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

	const hisas = await Promise.all(
		querySnapshot.docs.map(async (documentSnapshot) => {
			return { symbol: documentSnapshot.id };
		})
	);

	return hisas;
};

export const getAccounts = async (): Promise<IAccount[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('account').get();

	const usdToCadRate = await getTodaysRate();
	const cadToUsdRate = 1 / usdToCadRate;

	const accounts = await querySnapshot.docs.map(
		(documentSnapshot) => documentSnapshot.data() as IAccount
	);

	accounts.forEach((account) => {
		account.balances.forEach((balance) => {
			if (balance.currency === Currency.cad) {
				balance.amountCad = balance.amount;
				balance.amountUsd = balance.amount * cadToUsdRate;
			} else if (balance.currency === Currency.usd) {
				balance.amountUsd = balance.amount;
				balance.amountCad = balance.amount * usdToCadRate;
			}
		});
	});

	return accounts;
};

interface IQuestradeVirtualOrder {
	symbol: string;
	quantity: number;
	isSell: boolean;
	price: number;
	accountId: string;
	currency: Currency;
	type: AssetType;
}

export const insertVirtualOrdersIntoFirebase = async (): Promise<void> => {
	await initDeferredPromise.promise;

	const virtualOrders: IQuestradeVirtualOrder[] = [
		// {
		// 	symbol: 'wulf',
		// 	quantity: 500,
		// 	isSell: false,
		// 	price: 3.85,
		// 	accountId: '51443858',
		// 	currency: Currency.usd,
		// 	type: AssetType.stock,
		// },
	];

	if (virtualOrders.length === 0) {
		return;
	}

	const batch = firestore.batch();

	virtualOrders.forEach((order) => {
		const docRef = firestore.collection('virtualOrders').doc();
		batch.set(docRef, order);
	});

	await batch.commit();
	console.log('Virtual orders inserted into Firebase collection');
};

export const getVirtualOrders = async (): Promise<IOrder[]> => {
	console.log('firebase.get.virtualOrders (start)'.gray);
	await initDeferredPromise.promise;

	const usdToCadRate = await getTodaysRate();
	const cadToUsdRate = 1 / usdToCadRate;

	const querySnapshot = await firestore.collection('virtualOrders').get();

	console.log('firebase.get.virtualOrders (querySnapshot)'.magenta);

	const virtualOrders = querySnapshot.docs.map((documentSnapshot) => {
		const {
			symbol,
			quantity,
			isSell,
			price,
			accountId,
			currency,
			type,
		} = documentSnapshot.data() as IQuestradeVirtualOrder;

		return {
			symbol,
			type,
			taxable: true,
			action: isSell ? 'sell' : 'buy',
			quantity: quantity,
			openQuantity: quantity,
			filledQuantity: 0,
			totalQuantity: quantity,
			limitPrice: price,
			currency,
			accountId,
			stopPrice: 0,
			orderType: 'limit',
			avgExecPrice: 0,
			side: isSell ? 'sell' : 'buy',
			limitPriceCad: Currency.cad === currency ? price : price * usdToCadRate,
			limitPriceUsd: Currency.usd === currency ? price : price * cadToUsdRate,
			virtual: true,
		};
	});

	console.log('firebase.get.virtualOrders (end)'.gray);
	return virtualOrders;
};

export interface IKrakenStakingReward {
	symbol: string;
	date: string;
	usd: number;
	amount: number;
	allocationAmount: number;
}

interface IKrakenStakingRewardDoc
	extends firebase.firestore.DocumentData,
		IKrakenStakingReward {}

export const getKrakenStakingRewards = async (): Promise<
	IKrakenStakingReward[]
> => {
	console.log('firebase.get.krakenStakingRewards (start)'.gray);
	await initDeferredPromise.promise;

	const querySnapshot = await firestore.collection('krakenStakingRewards').get();

	console.log('firebase.get.krakenStakingRewards (querySnapshot)'.magenta);

	const results = querySnapshot.docs.map((documentSnapshot) => {
		const {
			symbol,
			date,
			usd,
			amount,
			allocationAmount,
		} = documentSnapshot.data() as IKrakenStakingRewardDoc;

		console.log(documentSnapshot.data());

		const data: IKrakenStakingReward = {
			symbol,
			date,
			usd,
			amount,
			allocationAmount,
		};

		return data;
	});

	console.log('firebase.get.krakenStakingRewards (end)'.gray);
	return results;
};

export interface IKrakenStakingTotalReward {
	symbol: string;
	amount: number;
	date: string;
}

export const updateKrakenTotalStakeRewards = async (
	reward: IKrakenStakingReward
): Promise<void> => {
	console.log('firebase.update.krakenStakingRewardCurrentPeriod (start)'.gray);
	await initDeferredPromise.promise;

	const totalRewardQuery = await firestore
		.collection('krakenStakingTotalRewards')
		.where('symbol', '==', reward.symbol)
		.get();
	const { symbol, amount, date, usd } = reward;

	if (totalRewardQuery.empty) {
		// Create new document
		const docRef = firestore.collection('krakenStakingTotalRewards').doc();
		await docRef.set({ symbol, amount, date });
		await addKrakenStakingReward({
			symbol,
			amount,
			date: date,
			usd,
			allocationAmount: reward.allocationAmount,
		});
	} else {
		// Update existing document
		const docRef = totalRewardQuery.docs[0].ref;
		const { amount: currentTotalAmount } = (
			await docRef.get()
		).data() as IKrakenStakingTotalReward;

		// reward hasn't changed
		if (currentTotalAmount === amount) {
			return;
		}

		if (currentTotalAmount > amount) {
			console.log(
				'firebase.update.krakenStakingRewardCurrentPeriod (amount decreased)'.red
			);
			return;
		}

		const diffAmount = amount - currentTotalAmount;
		const diffUsd = (usd / amount) * diffAmount;
		await docRef.update({ symbol, amount, date });
		await addKrakenStakingReward({
			symbol,
			amount: diffAmount,
			date: date,
			usd: diffUsd,
			allocationAmount: reward.allocationAmount,
		});
	}
};

export const addKrakenStakingReward = async (
	reward: IKrakenStakingReward
): Promise<void> => {
	console.log('firebase.create.krakenStakingReward (start)'.gray);
	await initDeferredPromise.promise;

	await firestore.collection('krakenStakingRewards').add({
		...reward,
	});
};
