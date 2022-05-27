/* global console */
import _ from 'lodash';
import crypto from 'crypto';
import path from 'path';
import moment from 'moment';
import 'colors';

import * as exchange from './library/exchange';
import * as firebase from './library/firebase';
import * as questrade from './library/questrade';
import * as questradeCloud from './library/questrade-cloud';
import * as cloud from './library/cloud';
import * as coinmarketcap from './library/coinmarketcap';
import * as binance from './library/binanace';
import { IAssessment } from '../../src/utils/assessment';
import { AssetType, Currency } from '../../src/utils/enum';
import { IQuote } from '../../src/utils/quote';
import { IOrder } from '../../src/utils/order';
import { IReview } from '../../src/utils/review';
import { IPosition } from '../../src/utils/position';
import { ITrade } from '../../src/utils/trade';
import { IDividend } from '../../src/utils/dividend';
import { ICompany } from '../../src/utils/company';
import { replaceSymbol } from './library/util';
import { IExchangeRate } from '../../src/utils/exchange';

const assessmentsPromise = firebase.getAssessments();
const questradeSync = questradeCloud.sync();
const positionsPromise = questrade.getPositions();
const ordersPromise = questrade.getActiveOrders();
const cryptoTradesPromise = firebase.getCryptoTrades();
const binanceOrdersPromise = binance.getOpenOrders();
const cryptoMetaDataPromise = firebase.getCryptoMetaData();
const ratesPromise = firebase.getExchangeRates();

const MARGIN_ACCOUNT_ID = 26418215;

const FILTER_SYMBOLS = ['ausa.cn', 'dlr.to', 'dlr.u.to', 'glh.cn.11480862'];
const SYMBOLS_TO_VIEW_IDS: string[] = [];

const SYMBOL_ID_REPLACEMENTS = [{ original: 20682, replacement: 11419766}, { original: 28114781, replacement: 41822360}];

const checkExchangeRate = async () => {
	const rate = process.env.USD_CAD;
	if (!rate) {
		return;
	}

	return firebase.setExchangeRate('USD_CAD', moment().format('YYYY-MM-DD'), Number(rate));
};

const cryptoPositionsPromise = (async () => {
	const trades = await cryptoTradesPromise;
	const rates = await ratesPromise;
	return firebase.calculateCryptoPositions(trades, rates);
})();

const assessmentsFillPromise = (async (): Promise<IAssessment[]> => {
	const assessments = await assessmentsPromise;
	await questradeSync;

	const missingSymbolIds: IAssessment[] = [];
	assessments.forEach((assessment) => {
		if (!assessment.symbolId) {
			missingSymbolIds.push(assessment);
		}
	});

	await Promise.all(
		missingSymbolIds.map(async (assessment) => {
			const symbolId = await questrade.findSymbolId(assessment.symbol);
			if (symbolId) {
				assessment.symbolId = symbolId;
				await firebase.setAssessment(assessment);
			}
		})
	);

	return assessments;
})();

const symbolIdsPromise = (async (): Promise<number[]> => {
	const positions = await positionsPromise;
	await questradeSync;
	const trades = cloud.readTrades();
	const assessments = await assessmentsFillPromise;
	const orders = await ordersPromise;

	let allSymbols = _.concat(
		_(positions)
			.map((q) => q.symbolId)
			.value(),
		_(trades)
			.filter({ type: AssetType.stock })
			.map((q) => q.symbolId)
			.value(),
		_(assessments)
			.filter({ type: AssetType.stock })
			.map((q) => q.symbolId)
			.value(),
		_(orders)
			.map((q) => q.symbolId)
			.value()
	);

	allSymbols = _(allSymbols).map(symbolId => SYMBOL_ID_REPLACEMENTS.find(s => s.original === symbolId)?.replacement || symbolId).uniq().filter().value();

	return allSymbols;
})();

const quotesPromise = (async (): Promise<questrade.IQuestradeQuote[]> => {
	const symbols = await symbolIdsPromise;

	const quotes = await questrade.getQuotes(symbols);
	return quotes;
})();

const companiesPromise = (async (): Promise<questrade.IQuestradeSymbol[]> => {
	const symbols = await symbolIdsPromise;

	const companies = await questrade.getSymbols(symbols);
	return companies;
})();

const cryptoSlugsPromise = (async (): Promise<string[]> => {
	const positions = await cryptoPositionsPromise;
	const assessments = await assessmentsFillPromise;
	const trades = await cryptoTradesPromise;
	const orders = await binanceOrdersPromise;

	const allSlugs = _.concat(
		_(positions)
			.map((q) => q.symbol)
			.map(coinmarketcap.symbolToSlug)
			.value(),
		_(assessments)
			.filter({ type: AssetType.crypto })
			.map((q) => q.symbol)
			.map(coinmarketcap.symbolToSlug)
			.value(),
		_(trades)
			.map((q) => q.symbol)
			.map(coinmarketcap.symbolToSlug)
			.value(),
		_(orders)
			.map((o) => o.symbol.replace('USDT', '').toLocaleLowerCase())
			.map(coinmarketcap.symbolToSlug)
			.value()
	);

	return _.uniq(allSlugs.filter(q => !!q));
})();

const cryptoQuotesPromise = (async (): Promise<
	coinmarketcap.ICoinMarketCapQuote[]
> => {
	const slugs = await cryptoSlugsPromise;

	return await coinmarketcap.quote(slugs);
})();

const hash = (content: string): string => {
	return crypto.createHash('md5').update(content).digest('hex');
};

const getTodaysRate = async (): Promise<number> => {
	await checkExchangeRate();
	const date = moment().format('YYYY-MM-DD');
	let rate = await exchange.getRate('usd', 'cad', date);
	if (rate) {
		return rate;
	}

	const rates = await ratesPromise;
	rate = _.find(rates, r => r.date === date)?.rate || null;
	if (rate) {
		return rate;
	}

	return 1;
}

const isUsd = (symbol: string): boolean =>
	symbol.indexOf('.') === -1 || symbol.indexOf('.u.') !== -1;

exports.createSchemaCustomization = ({ actions }) => {
	const { createTypes } = actions;
	const typeDefs = `
    type Order implements Node {
      position: Position
    }
	`;
	createTypes(typeDefs);
};

exports.sourceNodes = async ({ actions, createNodeId }, configOptions) => {
	const { createNode } = actions;

	const getPositionNodeId = (symbol: string): string => {
		return createNodeId(hash(`position${symbol}`));
	};

	const getTradeNodeId = (symbol: string, index: number): string => {
		return createNodeId(hash(`trade${symbol}${index}`));
	};

	const getDividendNodeId = (symbol: string, index: number): string => {
		return createNodeId(hash(`dividend${symbol}${index}`));
	};

	const getQuoteNodeId = (symbol: string): string => {
		return createNodeId(hash(`quote${symbol}`));
	};

	const getCompanyNodeId = (symbol: string): string => {
		return createNodeId(hash(`symbol${symbol}`));
	};

	const getAssessmentNodeId = (symbol: string): string => {
		return createNodeId(hash(`assessment${symbol}`));
	};

	const getOrderNodeId = (symbol: string, index: number): string => {
		return createNodeId(hash(`order${symbol}${index}`));
	};

	const getReviewNodeId = (year: number): string => {
		return createNodeId(hash(`review${year}`));
	};

	const getExchangeNodeId = (key: string, date: string): string => {
		return createNodeId(hash(`rate${key}${date}`));
	};

	exchange.init(configOptions.currency.api, configOptions.currency.apiKey);
	firebase.init(configOptions.firebase);
	coinmarketcap.init(
		configOptions.coinmarketcap.api,
		configOptions.coinmarketcap.apiKey
	);

	questrade.init(configOptions.questrade.cryptSecret);
	binance.init(
		configOptions.binance.api,
		configOptions.binance.apiKey,
		configOptions.binance.secretKey
	);

	const getExchange = getTodaysRate();
	const getNotes = firebase.getNotes();
	const getReviewsPromise = firebase.getReviews();

	const positions = await positionsPromise;
	const positionNodeIdsMap = {};
	_.forEach(positions, (position) => {
		position.symbol = replaceSymbol(position.symbol);
		positionNodeIdsMap[position.symbol] = getPositionNodeId(position.symbol);
	});

	const cryptoPositions = await cryptoPositionsPromise;
	_.forEach(cryptoPositions, (position) => {
		positionNodeIdsMap[position.symbol] = getPositionNodeId(position.symbol);
	});

	await questradeSync;
	const trades = cloud.readTrades();
	const tradeNodeIdsMap = {};
	_.forEach(trades, (trade, index) => {
		trade.symbol = replaceSymbol(trade.symbol);
		const nodeId = getTradeNodeId(trade.symbol, index);
		tradeNodeIdsMap[trade.symbol] = tradeNodeIdsMap[trade.symbol] || [];
		tradeNodeIdsMap[trade.symbol].push(nodeId);
	});

	const cryptoTrades = await cryptoTradesPromise;
	_.forEach(cryptoTrades, (trade, index) => {
		const nodeId = getTradeNodeId(trade.symbol, index);
		tradeNodeIdsMap[trade.symbol] = tradeNodeIdsMap[trade.symbol] || [];
		tradeNodeIdsMap[trade.symbol].push(nodeId);
	});

	const assessments = await assessmentsPromise;
	const assessmentNodeIdsMap = {};
	_.forEach(assessments, (assessment) => {
		assessmentNodeIdsMap[assessment.symbol] = getAssessmentNodeId(
			assessment.symbol
		);
	});

	const dividends = cloud.readDividends();
	const dividendNodeIdsMap = {};
	_.forEach(dividends, (dividend, index) => {
		const nodeId = getDividendNodeId(dividend.symbol, index);
		dividendNodeIdsMap[dividend.symbol] =
			dividendNodeIdsMap[dividend.symbol] || [];
		dividendNodeIdsMap[dividend.symbol].push(nodeId);
	});

	const quotes = await quotesPromise;
	const quoteNodeIdsMap = {};
	_.forEach(quotes, (quote) => {
		quote.symbol = replaceSymbol(quote.symbol);
		quoteNodeIdsMap[quote.symbol] = getQuoteNodeId(quote.symbol);
	});

	const cryptoQuotes = await cryptoQuotesPromise;
	_.forEach(cryptoQuotes, (quote) => {
		quoteNodeIdsMap[quote.symbol] = getQuoteNodeId(quote.symbol);
	});

	const companies = await companiesPromise;
	const companyNodeIdsMap = {};
	_.forEach(companies, (company) => {
		company.symbol = replaceSymbol(company.symbol);
		companyNodeIdsMap[company.symbol] = getCompanyNodeId(company.symbol);
	});

	const orders = await ordersPromise;
	const orderNodeIdsMap = {};
	_.forEach(orders, (order, index) => {
		const nodeId = getOrderNodeId(order.symbol, index);
		orderNodeIdsMap[order.symbol] = orderNodeIdsMap[order.symbol] || [];
		orderNodeIdsMap[order.symbol].push(nodeId);
	});

	const binanceOrders = await binanceOrdersPromise;
	_.forEach(binanceOrders, (order, index) => {
		const symbol = order.symbol.replace('USDT', '').toLocaleLowerCase();
		const nodeId = getOrderNodeId(symbol, index + orders.length);
		orderNodeIdsMap[symbol] = orderNodeIdsMap[symbol] || [];
		orderNodeIdsMap[symbol].push(nodeId);
	});

	// use crypto quotes to build company list
	_.forEach(cryptoQuotes, (quote) => {
		companyNodeIdsMap[quote.symbol] = getCompanyNodeId(quote.symbol);
	});

	interface INode {
		id?: string;
		parent?: any;
		children?: any[];
		internal?: any;
	}

	interface IAssessmentNode extends IAssessment, INode {
		trades___NODE: string;
		dividends___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		position___NODE: string;
	}

	const getAssessmentNodes = async (): Promise<IAssessmentNode[]> => {
		const assessments = await assessmentsFillPromise;
		const quotes = await quotesPromise;
		const cryptoQuotes = await cryptoQuotesPromise;
		const positions = await positionsPromise;
		const cryptoPositions = await cryptoPositionsPromise;

		const assessmentNodes = _.map(assessments, (assessment) => {
			const price =
				assessment.type === AssetType.stock
					? _.find(quotes, (q) => q.symbol === assessment.symbol)
							?.lastTradePriceTrHrs
					: _.find(cryptoQuotes, (q) => q.symbol === assessment.symbol)?.price;

			const totalCost =
				assessment.type === AssetType.stock
					? _.find(positions, (q) => q.symbol === assessment.symbol)?.totalCost
					: _.find(cryptoPositions, (q) => q.symbol === assessment.symbol)
							?.totalCostCad;

			const assessmentNode: IAssessmentNode = {
				...assessment,
				targetInvestmentProgress: assessment.targetInvestment
					? (totalCost || 0) / (assessment.targetInvestment || 0)
					: 0,
				targetPriceProgress: assessment.targetPrice
					? (price || 0) / (assessment.targetPrice || 0)
					: 0,
				symbol: assessment.symbol,
				trades___NODE: tradeNodeIdsMap[assessment.symbol] || [],
				dividends___NODE: dividendNodeIdsMap[assessment.symbol] || [],
				company___NODE: companyNodeIdsMap[assessment.symbol] || null,
				quote___NODE: quoteNodeIdsMap[assessment.symbol] || null,
				position___NODE: positionNodeIdsMap[assessment.symbol] || null,
			};

			const content = JSON.stringify(assessmentNode);

			_.defaults(assessmentNode, {
				id: getAssessmentNodeId(assessmentNode.symbol),
				parent: null,
				children: [],
				internal: {
					type: 'Assessment',
					content,
					contentDigest: crypto.createHash('md5').update(content).digest('hex'),
				},
			});

			return assessmentNode;
		});

		return assessmentNodes;
	};

	interface IOrderNode extends IOrder, INode {
		trades___NODE: string;
		dividends___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		position___NODE: string;
		assessment___NODE: string;
	}

	const mapBinanceOrders = async (
		binanceOrders: binance.IBinanceOrder[]
	): Promise<IOrder[]> => {
		const usdToCadRate = await getExchange;

		const orders: IOrder[] = binanceOrders.map((order) => ({
			symbol: order.symbol.replace('USDT', '').toLocaleLowerCase(),
			limitPrice: Number(order.price),
			limitPriceCad: Number(order.price) * Number(usdToCadRate),
			limitPriceUsd: Number(order.price),
			openQuantity: Number(order.origQty) - Number(order.executedQty),
			filledQuantity: Number(order.executedQty),
			totalQuantity: Number(order.origQty),
			stopPrice: Number(order.stopPrice),
			avgExecPrice: 0,
			side: order.side,
			accountId: 0,
			action: order.side === 'BUY' ? 'buy' : 'sell',
			type: order.type,
			currency: Currency.usd,
			orderType: order.type,
			accountName: 'binance',
		}));
		return orders;
	};

	const mapQuestradeOrders = async (
		questradeOrders: questrade.IQuestradeOrder[]
	): Promise<IOrder[]> => {
		const usdToCadRate = await getExchange;
		const cadToUsdRate = 1 / usdToCadRate;

		const orders: IOrder[] = questradeOrders.map((order) => {
			const currency: Currency = isUsd(order.symbol) ? Currency.usd : Currency.cad;
			const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
			const cadRate = currency === Currency.cad ? 1 : usdToCadRate;
			return {
				symbol: order.symbol,
				limitPrice: order.limitPrice,
				limitPriceUsd: order.limitPrice * usdRate,
				limitPriceCad: order.limitPrice * cadRate,
				openQuantity: order.openQuantity,
				filledQuantity: order.filledQuantity,
				totalQuantity: order.totalQuantity,
				orderType: order.orderType,
				stopPrice: order.stopPrice,
				avgExecPrice: order.avgExecPrice,
				side: order.side,
				accountId: Number(order.accountId),
				action: [questrade.QuestradeOrderSide.Buy, questrade.QuestradeOrderSide.BTO].includes(order.side) ? 'buy' : 'sell',
				type: order.orderType,
				accountName: questrade.getAccountName(order.accountId),
				currency,
			};
		});
		return orders;
	};

	const getOrderNodes = async (): Promise<IOrderNode[]> => {
		const questradeOrders = await ordersPromise;
		const binanceOrders = await binanceOrdersPromise;

		const mappedQuestradeOrders = await mapQuestradeOrders(questradeOrders);
		const mappedBinanceOrders = await mapBinanceOrders(binanceOrders);

		const orders = _.concat(mappedQuestradeOrders, mappedBinanceOrders);

		const orderNodes = _.map(orders, (order, index) => {
			const orderNode: IOrderNode = {
				...order,
				trades___NODE: tradeNodeIdsMap[order.symbol] || [],
				dividends___NODE: dividendNodeIdsMap[order.symbol] || [],
				company___NODE: companyNodeIdsMap[order.symbol] || null,
				quote___NODE: quoteNodeIdsMap[order.symbol] || null,
				position___NODE: positionNodeIdsMap[order.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[order.symbol] || null,
			};

			const content = JSON.stringify(orderNode);

			_.defaults(orderNode, {
				id: getOrderNodeId(orderNode.symbol, index),
				parent: null,
				children: [],
				internal: {
					type: 'Order',
					content,
					contentDigest: crypto.createHash('md5').update(content).digest('hex'),
				},
			});

			return orderNode;
		});

		return orderNodes;
	};

	interface INoteNode extends INode, firebase.IFirebaseNote {}

	const getNoteNodes = async (): Promise<INoteNode[]> => {
		const notes = await getNotes;

		const noteNodes = notes.map((note) => {
			const noteNode: INoteNode = {
				...note,
			};

			const content = JSON.stringify(noteNode);

			_.defaults(noteNode, {
				id: createNodeId(
					crypto.createHash('md5').update(noteNode.text).digest('hex')
				),
				parent: null,
				children: [],
				internal: {
					type: 'Note',
					content,
					contentDigest: crypto.createHash('md5').update(content).digest('hex'),
				},
			});

			return noteNode;
		});

		return noteNodes;
	};

	interface IReviewNode extends INode, IReview {}

	const getReviewNodes = async (): Promise<IReviewNode[]> => {
		const reviews = await getReviewsPromise;

		const reviewNodes = reviews.map((review) => {
			const reviewNode: IReviewNode = { ...review };

			const content = JSON.stringify(reviewNode);
			_.defaults(reviewNode, {
				id: getReviewNodeId(reviewNode.year),
				parent: null,
				children: [],
				internal: {
					type: 'Review',
					content,
					contentDigest: crypto.createHash('md5').update(content).digest('hex'),
				},
			});

			return reviewNode;
		});

		return reviewNodes;
	};

	interface IPositionNode extends INode, IPosition {
		trades___NODE: string;
		dividends___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		assessment___NODE: string;
		positions___NODE: string[];
	}

	const mapQuestradePositionToPosition = (
		position: questrade.IQuestradePosition,
		usdToCadRate: number,
		cadToUsdRate: number
	): IPosition => {
		const currency: Currency = isUsd(position.symbol)
			? Currency.usd
			: Currency.cad;
		const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
		const cadRate = currency === Currency.cad ? 1 : usdToCadRate;

		if (SYMBOLS_TO_VIEW_IDS.includes(position.symbol)) {
			console.log(`${position.symbol} : ${position.symbolId}`);
		}

		if (position.symbol === 'urnm') {
			position.totalCost = 11224.92;
			position.averageEntryPrice = 61.67;
			position.openPnl = position.currentMarketValue - position.totalCost;
		}

		return {
			symbol: position.symbol,
			currency,
			currentMarketValue: position.currentMarketValue,
			totalCost: position.totalCost,
			totalCostUsd: position.totalCost * usdRate,
			totalCostCad: position.totalCost * cadRate,
			currentMarketValueCad: position.currentMarketValue * cadRate,
			currentMarketValueUsd: position.currentMarketValue * usdRate,
			quantity: position.openQuantity,
			averageEntryPrice: position.averageEntryPrice,
			type: AssetType.stock,
			openPnl: position.openPnl,
			openPnlCad: position.openPnl * cadRate,
			openPnlUsd: position.openPnl * usdRate,
		};
	};

	const mapCryptoPositionToPosition = (
		position: firebase.ICryptoPosition,
		usdToCadRate: number,
		cadToUsdRate: number,
		cryptoQuotes: coinmarketcap.ICoinMarketCapQuote[]
	): IPosition => {
		// quote in usd, position in cad
		const quote = _.find(cryptoQuotes, { symbol: position.symbol });
		const price = quote?.price || 0;
		const totalCostUsd = position.totalCostUsd;
		const currentMarketValueUsd = price * position.quantity;
		const openPnlUsd = currentMarketValueUsd - totalCostUsd;

		return {
			symbol: position.symbol,
			currency: position.currency,
			currentMarketValue: currentMarketValueUsd,
			totalCost: totalCostUsd,
			totalCostUsd: totalCostUsd,
			totalCostCad: position.totalCostCad,
			currentMarketValueCad: currentMarketValueUsd * usdToCadRate,
			currentMarketValueUsd,
			quantity: position.quantity,
			averageEntryPrice: position.averageEntryPrice,
			type: AssetType.crypto,
			openPnl: openPnlUsd,
			openPnlCad: openPnlUsd * usdToCadRate,
			openPnlUsd: openPnlUsd
		};
	};

	const getPositionsNodes = async (): Promise<IPositionNode[]> => {
		const stockPositions = await positionsPromise;
		const cryptoPositions = await cryptoPositionsPromise;
		const cryptoQuotes = await cryptoQuotesPromise;
		const usdToCadRate = await getExchange;
		const cadToUsdRate = 1 / usdToCadRate;

		const positions: IPosition[] = _.concat(
			_(stockPositions)
				.filter((q) => !FILTER_SYMBOLS.includes(q.symbol))
				.map((p) => mapQuestradePositionToPosition(p, usdToCadRate, cadToUsdRate))
				.value(),
			_.map(cryptoPositions, (p) =>
				mapCryptoPositionToPosition(p, usdToCadRate, cadToUsdRate, cryptoQuotes)
			)
		);

		return positions.map((position) => {
			const linkedPositions: string[] = [];

			if (position.symbol === 'btc') {
				linkedPositions.push(positionNodeIdsMap['qbtc.u.to']);
				linkedPositions.push(positionNodeIdsMap['qbtc.to']);
				linkedPositions.push(positionNodeIdsMap['gbtc']);
			} else if (position.symbol === 'eth') {
				linkedPositions.push(positionNodeIdsMap['qeth.u.to']);
				linkedPositions.push(positionNodeIdsMap['qeth.to']);
				linkedPositions.push(positionNodeIdsMap['qeth']);
			}
			const positionNode: IPositionNode = {
				...position,
				trades___NODE: tradeNodeIdsMap[position.symbol] || [],
				dividends___NODE: dividendNodeIdsMap[position.symbol] || [],
				company___NODE: companyNodeIdsMap[position.symbol] || null,
				quote___NODE: quoteNodeIdsMap[position.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[position.symbol] || null,
				positions___NODE: _.filter(linkedPositions),
			};

			const content = JSON.stringify(positionNode);
			_.defaults(positionNode, {
				id: positionNodeIdsMap[positionNode.symbol],
				parent: null,
				children: [],
				internal: {
					type: 'Position',
					content,
					contentDigest: hash(content),
				},
			});

			return positionNode;
		});
	};

	interface ITradeNode extends INode, ITrade {
		position___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		assessment___NODE: string;
		exchange___NODE: string;
	}

	const mapQuestradeTradesToTrades = (
		trade: cloud.ICloudTrade,
		cadToUsdRate: number,
		usdToCadRate: number
	): ITrade => {
		const currency: Currency =
			trade.currency === 'usd' ? Currency.usd : Currency.cad;
		const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
		const cadRate = currency === Currency.cad ? 1 : usdToCadRate;

		if (SYMBOLS_TO_VIEW_IDS.includes(trade.symbol)) {
			console.log(`${trade.symbol} : ${trade.symbolId}`);
		}

		return {
			isSell: trade.action === 'sell',
			symbol: trade.symbol,
			accountId: parseInt(trade.accountId as any),
			priceCad: trade.price * cadRate,
			priceUsd: trade.price * usdRate,
			timestamp: new Date(trade.date).getTime(),
			pnl: trade.pnl,
			pnlCad: trade.pnl * cadRate,
			pnlUsd: trade.pnl * usdRate,
			currency,
			price: trade.price,
			quantity: trade.quantity,
			action: trade.action,
			type: AssetType.stock,
			isOpeningPositionTrade: false,
			taxable: trade.accountId === MARGIN_ACCOUNT_ID,
			accountName: questrade.getAccountName(trade.accountId),
		};
	};

	const mapCryptoTradeToTrade = (
		trade: firebase.ICryptoTrade,
		cadRate: number,
		usdRate: number
	): ITrade => ({
		isSell: trade.isSell,
		symbol: trade.symbol,
		accountId: 0,
		priceCad: trade.price,
		priceUsd: trade.price * cadRate,
		timestamp: trade.timestamp,
		pnl: trade.pnl,
		pnlCad: trade.pnl,
		pnlUsd: trade.pnl * cadRate,
		currency: Currency.cad,
		price: trade.price,
		quantity: trade.quantity,
		action: trade.isSell ? 'sell' : 'buy',
		type: AssetType.crypto,
		isOpeningPositionTrade: false,
		taxable: true,
		accountName: 'binance'
	});

	const setOpeningTrade = (trades: ITrade[]): void => {
		let quantity = 0;
		let openingTrade: ITrade | null = null;
		const orderedTrades = _.orderBy(trades, (t) => t.timestamp, 'asc');
		_.forEach(orderedTrades, (trade) => {
			if (!quantity) {
				openingTrade = trade;
			}
			const action = trade.action == 'sell' ? -1 : 1;
			quantity += trade.quantity * action;
			quantity = Math.max(quantity, 0);
		});

		if (!openingTrade) {
			return;
		}

		(openingTrade as ITrade).isOpeningPositionTrade = true;
	};

	const getTradeNodes = async (): Promise<ITradeNode[]> => {
		await questradeSync;

		const cryptoTrades = await cryptoTradesPromise;
		const cloudTrades = cloud.readTrades();
		const usdToCadRate = await getExchange;
		const cadToUsdRate = 1 / usdToCadRate;

		const trades = _.concat(
			_.map(cloudTrades, (t) =>
				mapQuestradeTradesToTrades(t, cadToUsdRate, usdToCadRate)
			),
			_.map(cryptoTrades, (t) =>
				mapCryptoTradeToTrade(t, cadToUsdRate, usdToCadRate)
			)
		);

		const groupedTradesDictionary = _.groupBy(trades, (t) => t.symbol);
		_.forEach(groupedTradesDictionary, (groupedTrades) => {
			setOpeningTrade(groupedTrades);
		});

		let cryptoIndex = 0;
		return trades.map((trade, index) => {
			const tradeNode: ITradeNode = {
				...trade,
				position___NODE: positionNodeIdsMap[trade.symbol] || null,
				company___NODE: companyNodeIdsMap[trade.symbol] || null,
				quote___NODE: quoteNodeIdsMap[trade.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[trade.symbol] || null,
				exchange___NODE: getExchangeNodeId(
					'USD_CAD',
					moment(trade.timestamp).format('YYYY-MM-DD')
				),
			};

			const content = JSON.stringify(tradeNode);
			let nodeId = getTradeNodeId(tradeNode.symbol, index);
			if (trade.type === 'crypto') {
				nodeId = getTradeNodeId(tradeNode.symbol, cryptoIndex);
				cryptoIndex++;
			}
			_.defaults(tradeNode, {
				id: nodeId,
				parent: null,
				children: [],
				internal: {
					type: 'Trade',
					content,
					contentDigest: hash(content),
				},
			});

			return tradeNode;
		});
	};

	interface IDividendNode extends INode, IDividend {
		position___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		assessment___NODE: string;
	}

	const getDividendNodes = async (): Promise<IDividendNode[]> => {
		await questradeSync;

		const dividends = cloud.readDividends();
		const usdToCadRate = await getExchange;
		const cadToUsdRate = 1 / usdToCadRate;

		return dividends.map((dividend, index) => {
			const usdRate = dividend.currency === 'usd' ? 1 : cadToUsdRate;
			const cadRate = dividend.currency === 'cad' ? 1 : usdToCadRate;

			const dividendNode: IDividendNode = {
				position___NODE: positionNodeIdsMap[dividend.symbol] || null,
				company___NODE: companyNodeIdsMap[dividend.symbol] || null,
				quote___NODE: quoteNodeIdsMap[dividend.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[dividend.symbol] || null,
				symbol: dividend.symbol,
				amount: dividend.amount,
				currency: dividend.currency === 'usd' ? Currency.usd : Currency.cad,
				accountId: dividend.accountId,
				timestamp: new Date(dividend.date).getTime(),
				amountUsd: dividend.amount * usdRate,
				amountCad: dividend.amount * cadRate,
			};

			const content = JSON.stringify(dividendNode);
			_.defaults(dividendNode, {
				id: getDividendNodeId(dividendNode.symbol, index),
				parent: null,
				children: [],
				internal: {
					type: 'Dividend',
					content,
					contentDigest: hash(content),
				},
			});

			return dividendNode;
		});
	};

	interface IQuoteNode extends INode, IQuote {
		position___NODE: string;
		company___NODE: string;
		trades___NODE: string[];
		assessment___NODE: string;
	}

	const mapQuestradeQuoteToQuote = (
		quote: questrade.IQuestradeQuote,
		usdToCadRate: number,
		cadToUsdRate: number
	): IQuote => {
		const currency: Currency = isUsd(quote.symbol) ? Currency.usd : Currency.cad;
		const usdRate = currency === Currency.usd ? 1 : cadToUsdRate;
		const cadRate = currency === Currency.cad ? 1 : usdToCadRate;

		return {
			symbol: quote.symbol,
			price: quote.lastTradePriceTrHrs,
			priceCad: quote.lastTradePriceTrHrs * cadRate,
			priceUsd: quote.lastTradePriceTrHrs * usdRate,
			currency,
			type: AssetType.stock,
			afterHoursPrice: quote.lastTradePrice,
			symbolId: quote.symbolId,
		};
	};

	const mapCryptoQuoteToQuote = (
		quote: coinmarketcap.ICoinMarketCapQuote,
		usdToCadRate: number
	): IQuote => {
		const currency: Currency = Currency.usd;
		const usdRate = 1;
		const cadRate = usdToCadRate;

		return {
			symbol: quote.symbol,
			price: quote.price,
			priceCad: quote.price * cadRate,
			priceUsd: quote.price * usdRate,
			currency,
			type: AssetType.crypto,
			afterHoursPrice: quote.price,
			symbolId: undefined,
		};
	};

	const getQuoteNodes = async (): Promise<IQuoteNode[]> => {
		const stockQuotes = await quotesPromise;
		const cryptoQuotes = await cryptoQuotesPromise;

		const usdToCadRate = await getExchange;
		const cadToUsdRate = 1 / usdToCadRate;

		const quotes = _.concat(
			_.map(stockQuotes, (q) =>
				mapQuestradeQuoteToQuote(q, usdToCadRate, cadToUsdRate)
			),
			_.map(cryptoQuotes, (q) => mapCryptoQuoteToQuote(q, usdToCadRate))
		);

		return quotes.map((quote) => {
			const quoteNode: IQuoteNode = {
				...quote,
				position___NODE: positionNodeIdsMap[quote.symbol] || null,
				company___NODE: companyNodeIdsMap[quote.symbol] || null,
				trades___NODE: tradeNodeIdsMap[quote.symbol] || [],
				assessment___NODE: assessmentNodeIdsMap[quote.symbol] || null,
			};

			const content = JSON.stringify(quoteNode);
			_.defaults(quoteNode, {
				id: getQuoteNodeId(quoteNode.symbol),
				parent: null,
				children: [],
				internal: {
					type: 'Quote',
					content,
					contentDigest: hash(content),
				},
			});

			return quoteNode;
		});
	};

	interface ICompanyNode extends INode, ICompany {
		position___NODE: string;
		quote___NODE: string;
		trades___NODE: string[];
		dividends___NODE: string[];
		assessment___NODE: string;
		orders___NODE: string[];
	}

	const mapQuestradeSymbolToCompany = (
		s: questrade.IQuestradeSymbol
	): ICompany => {
		return {
			symbol: s.symbol,
			name: s.description,
			prevDayClosePrice: s.prevDayClosePrice,
			pe: s.pe,
			yield: s.yield,
			type: AssetType.stock,
			marketCap: s.marketCap,
			exchange: s.exchange,
			highPrice52: s.highPrice52,
			lowPrice52: s.lowPrice52,
		};
	};

	const mapCryptoQuoteToCompany = (
		q: coinmarketcap.ICoinMarketCapQuote,
		allMetaData: firebase.ICryptoMetaData[]
	): ICompany => {
		const metaData = _.find(allMetaData, (m) => m.symbol === q.symbol);
		return {
			marketCap: q.marketCap,
			symbol: q.symbol,
			name: q.name,
			exchange: 'CMC',
			pe: undefined,
			yield: 0,
			prevDayClosePrice: q.prevDayClosePrice,
			type: AssetType.crypto,
			highPrice52: metaData?.allTimeHighUsd || q.price,
			lowPrice52: metaData?.oneYearLowUsd || q.price,
		};
	};

	const getCompanyNodes = async (): Promise<ICompanyNode[]> => {
		const stockCompanies = await companiesPromise;
		const cryptoQuotes = await cryptoQuotesPromise;
		const cryptoMetaData = await cryptoMetaDataPromise;

		const companies = _.concat(
			stockCompanies.map(mapQuestradeSymbolToCompany),
			cryptoQuotes.map((q) => mapCryptoQuoteToCompany(q, cryptoMetaData))
		);

		return companies.map((company) => {
			const companyNode = {
				...company,
				position___NODE: positionNodeIdsMap[company.symbol] || null,
				quote___NODE: quoteNodeIdsMap[company.symbol] || null,
				trades___NODE: tradeNodeIdsMap[company.symbol] || [],
				dividends___NODE: dividendNodeIdsMap[company.symbol] || [],
				company___NODE: companyNodeIdsMap[company.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[company.symbol] || null,
				orders___NODE: orderNodeIdsMap[company.symbol] || [],
			};

			const content = JSON.stringify(companyNode);
			_.defaults(companyNode, {
				id: getCompanyNodeId(companyNode.symbol),
				parent: null,
				children: [],
				internal: {
					type: 'Company',
					content,
					contentDigest: hash(content),
				},
			});

			return companyNode;
		});
	};

	const getBalanceNodes = async () => {
		const balances = await questrade.getBalances();

		const usdToCadRate = await getExchange;
		const cadToUsdRate = 1 / usdToCadRate;

		const usdBalance = _.find(balances, (q) => q.currency === Currency.usd);
		if (usdBalance) {
			usdBalance.cash += (9378.11 + 2638.65 + 4440.13 + 1193 + 8628 + 3073) // binance, binance, nexo, blockfi, blockfi
		}

		const cadCash =
			_.find(balances, (q) => q.currency === Currency.cad)?.cash || 0;
		const usdCash =
			_.find(balances, (q) => q.currency === Currency.usd)?.cash || 0;
		
		

		balances.push({
			currency: Currency.cad,
			cash: cadCash + usdCash * usdToCadRate,
			combined: true,
		});

		balances.push({
			currency: Currency.usd,
			cash: usdCash + cadCash * cadToUsdRate,
			combined: true,
		});

		balances.forEach((balance) => {
			const content = JSON.stringify(balance);
			_.defaults(balance, {
				id: createNodeId(hash(`balance${balance.currency}${balance.combined}`)),
				parent: null,
				children: [],
				internal: {
					type: 'Balance',
					content,
					contentDigest: hash(content),
				},
			});
		});

		return balances;
	};

	interface IRateNode extends IExchangeRate, INode {}

	const getExchangeRateNodes = async (): Promise<IRateNode[]> => {
		await questradeSync;

		const dividends = cloud.readDividends();
		const trades = cloud.readTrades();
		const cryptoTrades = await cryptoTradesPromise;

		const marginUsdTradeDates = _(trades)
			.filter(
				(q) => q.accountId === MARGIN_ACCOUNT_ID && q.currency === Currency.usd
			)
			.map((trade) => moment(trade.date).format('YYYY-MM-DD'))
			.uniq()
			.value();

		const marginUsdDividendDates = _(dividends)
			.filter(
				(q) => q.accountId === MARGIN_ACCOUNT_ID && q.currency === Currency.usd
			)
			.map((dividend) => moment(dividend.date).format('YYYY-MM-DD'))
			.uniq()
			.value();

		const cryptoTradeDates = _(cryptoTrades)
			.map((trade) => moment(trade.timestamp).format('YYYY-MM-DD'))
			.uniq()
			.value();

		const dates = _([
			marginUsdTradeDates,
			marginUsdDividendDates,
			cryptoTradeDates,
		])
			.flatten()
			.uniq()
			.value();

		const rates: IExchangeRate[] = await ratesPromise;
		const exchangeRateDates = rates.map(r => r.date);	
		// console.log('missing rates', _.without(dates,  ...exchangeRateDates));

		return rates.map((rate) => {
			const rateNode = rate;
			const content = JSON.stringify(rateNode);
			_.defaults(rateNode, {
				id: getExchangeNodeId(rateNode.key, rateNode.date),
				parent: null,
				children: [],
				internal: {
					type: 'ExchangeRate',
					content,
					contentDigest: hash(content),
				},
			});
			return rateNode;
		});
	};

	const outputCleared = (text: string): void => {
		console.log(`cleared`.magenta + ' ' + text);
	};

	const getAll = async (): Promise<any[]> => {
		const assessmentsPromise = getAssessmentNodes();
		const notesPromise = getNoteNodes();
		const positionNodesPromise = getPositionsNodes();
		const tradeNodesPromise = getTradeNodes();
		const dividendNodesPromise = getDividendNodes();
		const quoteNodesPromise = getQuoteNodes();
		const companyNodesPromise = getCompanyNodes();
		const balanceNodesPromise = getBalanceNodes();
		// const profitsAndLossesNodesPromise = getProfitsAndLossesNodes();
		const exchangeRateNodesPromise = getExchangeRateNodes();
		const orderNodesPromise = getOrderNodes();
		const reviewNodesPromise = getReviewNodes();

		const assessments = await assessmentsPromise;
		outputCleared('assessments');
		const notes = await notesPromise;
		outputCleared('notes');
		const questradePositions = await positionNodesPromise;
		outputCleared('positions');
		const questradeTrades = await tradeNodesPromise;
		outputCleared('trades');
		const questradeDividends = await dividendNodesPromise;
		outputCleared('dividends');
		const questradeQuotes = await quoteNodesPromise;
		outputCleared('quotes');
		const questradeCompanies = await companyNodesPromise;
		outputCleared('companies');
		const balanceNodes = await balanceNodesPromise;
		outputCleared('balances');
		const exchangeRateNodes = await exchangeRateNodesPromise;
		outputCleared('exchange rates');
		const orderNodes = await orderNodesPromise;
		outputCleared('orders');
		const reviewNodes = await reviewNodesPromise;
		outputCleared('reviews');

		await firebase.checkAndUpdateCryptoMetaData(cryptoQuotesPromise);

		outputCleared('ALL!');
		return _.concat(
			assessments as any[],
			notes,
			questradePositions,
			questradeTrades,
			questradeDividends,
			questradeQuotes,
			questradeCompanies,
			balanceNodes,
			// profitsAndLossesNodes,
			exchangeRateNodes,
			orderNodes,
			// buildTimeNodes,
			reviewNodes
		);
	};

	delete configOptions.plugins;

	const nodes = await getAll();
	nodes.forEach((node) => {
		createNode(node);
	});
};

exports.createPages = async ({ actions }) => {
	const { createPage } = actions;

	const stockQuotes = await quotesPromise;
	const cryptoQuotes = await cryptoQuotesPromise;

	const quotes = _.concat(
		stockQuotes.map((q) => q.symbol),
		cryptoQuotes.map((q) => q.symbol)
	);

	quotes.forEach((symbol) => {
		createPage({
			path: `stock/${symbol}`,
			component: path.resolve('./src/templates/stock.tsx'),
			context: {
				symbol: symbol,
			},
		});
	});
};
