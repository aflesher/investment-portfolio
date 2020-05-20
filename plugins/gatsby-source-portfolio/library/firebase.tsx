import admin from 'firebase-admin';
import _ from 'lodash';

import { deferredPromise } from './util';
import { IAssessment } from '../../../src/utils/assessment';
import { IExchangeRate } from '../../../src/utils/exchange';
import { IPosition } from '../../../src/utils/position';
import { Currency, AssetType } from '../../../src/utils/enum';
import { IReview } from '../../../src/utils/review';

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

export const getNotes = async (): Promise<void> => {
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

export const setQuestradeActivityDate = async (questradeActivityDate: IState): Promise<void> => {
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

export const getExchangeRate = async (key: string, date: Date): Promise<IExchangeRate> => {
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

export const getCryptoPositions = async (): Promise<Pick<IPosition, 'currency' | 'type' |
	'averageEntryPrice' | 'quantity' | 'symbol' | 'totalCostCad' >[]> =>
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

export const getReviews = async (): Promise<IReview[]> => {
	await initDeferredPromise.promise;

	const querySnapshot = await firestore
		.collection('reviews')
		.get();
	
	return querySnapshot.docs.map(documentSnapshot => documentSnapshot.data());
};