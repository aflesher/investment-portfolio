/* global console */
import _ from 'lodash';
import crypto from 'crypto';
import path from 'path';
import moment from 'moment';
import 'colors';

import * as exchange from './library/exchange';
import * as firebase from './library/firebase';
import * as questrade from './library/questrade';
import * as coinmarketcap from './library/coinmarketcap';
import * as kraken from './library/kraken';
import {
	IAssessment,
	IQuote,
	IOrder,
	IReview,
	IPosition,
	ITrade,
	ICompany,
	IEarningsDate,
	IStockSplit,
	IExchangeRate,
	IDividend,
} from '../../declarations';
import { getEarningsDates } from './library/earnings-calendar';
import { getTrades } from './library/trades';
import { getDividends } from './library/dividends';
import { getQuotes } from './library/quotes';
import { getOrders } from './library/orders';
import { getPositions } from './library/positions';
import { getCompanies } from './library/companies';
import { IAccount } from '../../declarations/account';
import { getAccounts } from './library/accounts';
import { getAssessments } from './library/assessment';
import { querySymbol } from './library/debug';

const assessmentsPromise = getAssessments();
const stockSplitsPromise = firebase.getStockSplits();
const tradesPromise = getTrades();
const dividendsPromise = getDividends();
const ordersPromise = getOrders();
const accountsPromise = getAccounts();
const quotesPromise = Promise.all([
	tradesPromise,
	ordersPromise,
	assessmentsPromise,
]).then(([trades, orders, assessments]) =>
	getQuotes(trades, orders, assessments)
);
const positionsPromise = Promise.all([
	tradesPromise,
	quotesPromise,
]).then(([trades, quotes]) => getPositions(trades, quotes));

const companiesPromise = quotesPromise.then((quotes) => getCompanies(quotes));

const earningsDatesPromise = (async (): Promise<IEarningsDate[]> => {
	const positions = await positionsPromise;
	const symbols = positions.map((p) => p.symbol);
	return getEarningsDates(symbols);
})();

// querySymbol('weed');

const hash = (content: string): string => {
	return crypto.createHash('md5').update(content).digest('hex');
};

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

	const getEarningsDateNodeId = (symbol: string): string => {
		return createNodeId(hash(`earningsDate${symbol}`));
	};

	const getAccountNodeId = (accountName: string): string => {
		return createNodeId(hash(`cash${accountName}`));
	};

	const getStockSplitNodeId = (symbol: string, index: number): string => {
		return createNodeId(hash(`split${symbol}${index}`));
	};

	exchange.init(
		configOptions.openexchangerates.api,
		configOptions.openexchangerates.appId
	);
	firebase.init(configOptions.firebase);
	coinmarketcap.init(
		configOptions.coinmarketcap.api,
		configOptions.coinmarketcap.apiKey
	);
	questrade.init(configOptions.questrade.cryptSecret);
	kraken.init(configOptions.kraken.key, configOptions.kraken.secret);

	const getNotes = firebase.getNotes();
	const getReviewsPromise = firebase.getReviews();

	const positions = await positionsPromise;
	const positionNodeIdsMap = {};
	_.forEach(positions, (position) => {
		positionNodeIdsMap[position.symbol] = getPositionNodeId(position.symbol);
	});

	const trades = await tradesPromise;
	const tradeNodeIdsMap = {};
	_.forEach(trades, (trade, index) => {
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

	const earningsDates = await earningsDatesPromise;
	const earningsDatesNodeIdsMap = {};
	_.forEach(earningsDates, ({ symbol }) => {
		earningsDatesNodeIdsMap[symbol] = getEarningsDateNodeId(symbol);
	});

	const dividends = await dividendsPromise;
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
		quoteNodeIdsMap[quote.symbol] = getQuoteNodeId(quote.symbol);
	});

	const companies = await companiesPromise;
	const companyNodeIdsMap = {};
	_.forEach(companies, (company) => {
		companyNodeIdsMap[company.symbol] = getCompanyNodeId(company.symbol);
	});

	const orders = await ordersPromise;
	const orderNodeIdsMap = {};
	_.forEach(orders, (order, index) => {
		const nodeId = getOrderNodeId(order.symbol, index);
		orderNodeIdsMap[order.symbol] = orderNodeIdsMap[order.symbol] || [];
		orderNodeIdsMap[order.symbol].push(nodeId);
	});

	interface INode {
		id?: string;
		parent?: null;
		children?: INode[];
		internal?: { type: string; content: string; contentDigest: string };
	}

	interface IAssessmentNode extends IAssessment, INode {
		trades___NODE: string;
		dividends___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		position___NODE: string;
	}

	const getAssessmentNodes = async (): Promise<IAssessmentNode[]> => {
		const assessments = await assessmentsPromise;
		const quotes = await quotesPromise;
		const positions = await positionsPromise;

		const assessmentNodes = _.map(assessments, (assessment) => {
			const price = quotes.find((q) => q.symbol === assessment.symbol)?.price;
			const totalCost = positions.find((q) => q.symbol === assessment.symbol)
				?.totalCost;

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

	const getOrderNodes = async (): Promise<IOrderNode[]> => {
		const orders = await ordersPromise;

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
		earnings___NODE: string;
	}

	const getPositionsNodes = async (): Promise<IPositionNode[]> => {
		const positions = await positionsPromise;

		return positions.map((position) => {
			const positionNode: IPositionNode = {
				...position,
				trades___NODE: tradeNodeIdsMap[position.symbol] || [],
				dividends___NODE: dividendNodeIdsMap[position.symbol] || [],
				company___NODE: companyNodeIdsMap[position.symbol] || null,
				quote___NODE: quoteNodeIdsMap[position.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[position.symbol] || null,
				earnings___NODE: earningsDatesNodeIdsMap[position.symbol] || null,
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

	const getTradeNodes = async (): Promise<ITradeNode[]> => {
		const trades = await tradesPromise;

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
			const nodeId = getTradeNodeId(tradeNode.symbol, index);
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
		const dividends = await dividendsPromise;

		return dividends.map((dividend, index) => {
			const dividendNode: IDividendNode = {
				position___NODE: positionNodeIdsMap[dividend.symbol] || null,
				company___NODE: companyNodeIdsMap[dividend.symbol] || null,
				quote___NODE: quoteNodeIdsMap[dividend.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[dividend.symbol] || null,
				...dividend,
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

	const getQuoteNodes = async (): Promise<IQuoteNode[]> => {
		const quotes = await quotesPromise;

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

	const getCompanyNodes = async (): Promise<ICompanyNode[]> => {
		const companies = await companiesPromise;

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

	interface IAccountNode extends INode, IAccount {}

	const getAccountNodes = async (): Promise<IAccountNode[]> => {
		const accounts = await accountsPromise;

		return accounts.map((account) => {
			const accountNode = { ...account };
			const content = JSON.stringify(accountNode);
			_.defaults(accountNode, {
				id: getAccountNodeId(accountNode.accountId),
				parent: null,
				children: [],
				internal: {
					type: 'Account',
					content,
					contentDigest: hash(content),
				},
			});
			return accountNode;
		});
	};

	interface IRateNode extends IExchangeRate, INode {}

	const getExchangeRateNodes = async (): Promise<IRateNode[]> => {
		const ratesLookup = await exchange.getExchangeRates();
		const rates = Object.keys(ratesLookup).map((date) => {
			return {
				key: 'USD_CAD',
				date,
				rate: ratesLookup[date],
			};
		});

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

	interface IEarningsDateNode extends INode, IEarningsDate {
		position___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		assessment___NODE: string;
	}

	const getEarningsNodes = async (): Promise<IEarningsDateNode[]> => {
		const scrapedEarnings = await earningsDatesPromise;
		await firebase.checkAndUpdateEarningsDates(scrapedEarnings);
		const earnings = await firebase.getEarningsDates();
		return earnings.map((e) => {
			const earningsNode: IEarningsDateNode = {
				...e,
				position___NODE: positionNodeIdsMap[e.symbol] || null,
				quote___NODE: quoteNodeIdsMap[e.symbol] || null,
				company___NODE: companyNodeIdsMap[e.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[e.symbol] || null,
			};
			const content = JSON.stringify(earningsNode);
			_.defaults(earningsNode, {
				id: getEarningsDateNodeId(e.symbol),
				parent: null,
				children: [],
				internal: {
					type: 'EarningsDate',
					content,
					contentDigest: hash(content),
				},
			});
			return earningsNode;
		});
	};

	interface IStockSplitNode extends INode, IStockSplit {
		position___NODE: string;
		company___NODE: string;
		quote___NODE: string;
		assessment___NODE: string;
	}

	const getStockSplitNodes = async (): Promise<IStockSplitNode[]> => {
		const stockSplits = await stockSplitsPromise;
		return stockSplits.map((stockSplit, index) => {
			const stockSplitNode: IStockSplitNode = {
				...stockSplit,
				position___NODE: positionNodeIdsMap[stockSplit.symbol] || null,
				quote___NODE: quoteNodeIdsMap[stockSplit.symbol] || null,
				company___NODE: companyNodeIdsMap[stockSplit.symbol] || null,
				assessment___NODE: assessmentNodeIdsMap[stockSplit.symbol] || null,
			};
			const content = JSON.stringify(stockSplitNode);
			_.defaults(stockSplitNode, {
				id: getStockSplitNodeId(stockSplitNode.symbol, index),
				parent: null,
				children: [],
				internal: {
					type: 'StockSplit',
					content,
					contentDigest: hash(content),
				},
			});
			return stockSplitNode;
		});
	};

	const outputCleared = (text: string): void => {
		console.log(`cleared`.magenta + ' ' + text);
	};

	const getAll = async (): Promise<INode[]> => {
		const assessmentsPromise = getAssessmentNodes();
		const notesPromise = getNoteNodes();
		const positionNodesPromise = getPositionsNodes();
		const tradeNodesPromise = getTradeNodes();
		const dividendNodesPromise = getDividendNodes();
		const quoteNodesPromise = getQuoteNodes();
		const companyNodesPromise = getCompanyNodes();
		const exchangeRateNodesPromise = getExchangeRateNodes();
		const orderNodesPromise = getOrderNodes();
		const reviewNodesPromise = getReviewNodes();
		const earningsNodesPromise = getEarningsNodes();
		const accountNodesPromise = getAccountNodes();
		const stockSplitNodesPromise = getStockSplitNodes();

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
		const exchangeRateNodes = await exchangeRateNodesPromise;
		outputCleared('exchange rates');
		const orderNodes = await orderNodesPromise;
		outputCleared('orders');
		const reviewNodes = await reviewNodesPromise;
		outputCleared('reviews');
		const earningsNodes = await earningsNodesPromise;
		outputCleared('earnings nodes');
		const accountNodes = await accountNodesPromise;
		outputCleared('cash nodes');
		const stockSplitNodes = await stockSplitNodesPromise;
		outputCleared('stock split nodes');

		outputCleared('ALL!');
		return [
			...assessments,
			...notes,
			...questradePositions,
			...questradeTrades,
			...questradeDividends,
			...questradeQuotes,
			...questradeCompanies,
			...exchangeRateNodes,
			...orderNodes,
			...reviewNodes,
			...earningsNodes,
			...accountNodes,
			...stockSplitNodes,
		];
	};

	delete configOptions.plugins;

	const nodes = await getAll();
	nodes.forEach((node) => {
		createNode(node);
	});
};

exports.createPages = async ({ actions }) => {
	const { createPage } = actions;

	const quotes = await quotesPromise;

	quotes.forEach(({ symbol }) => {
		createPage({
			path: `stock/${symbol}`,
			component: path.resolve('./src/templates/stock.tsx'),
			context: {
				symbol: symbol,
			},
		});
	});
};
