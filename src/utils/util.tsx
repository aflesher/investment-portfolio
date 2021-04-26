import numeral from 'numeral';
import moment from 'moment-timezone';
import _ from 'lodash';
import { AssetType } from './enum';

export const displayMarketCap = (value: number): string => numeral(value).format('$1.00 a');

export const faClassForSymbol = (symbol: string): string => {
	const lookup: any = {
		btc: 'fab fa-btc mr-2',
		gbtc: 'fab fa-btc mr-2',
		xmr: 'fab fa-monero mr-2',
		eth: 'fab fa-ethereum mr-2',
		amzn: 'fab fa-amazon mr-2',
		fb: 'fab fa-facebook-f mr-2',
		pins: 'fab fa-pinterest-p mr-2',
		msft: 'fab fa-microsoft mr-2',
		urnm: 'fas fa-radiation-alt mr-2'
	};

	return lookup[symbol] || '';
};

export const formatDate = (timestamp: number) => {
	return moment(timestamp)
		.tz('America/New_York')
		.format('ddd, MMM DD YYYY');
};


export const formatDateShort = (timestamp: number): string => {
	return moment(timestamp)
		.tz('America/New_York')
		.format('MMM DD `YY');
};

export const dateInputFormat = (date: Date): string => moment(date).format('YYYY-MM-DD');

export const positiveNegativeText = (isPositive: boolean, isNeutral?: boolean): string => {
	if (isNeutral === true) {
		return '';
	}

	return isPositive ? 'text-positive' : 'text-negative';
};

export const marketCap = (value: number): string => {
	return numeral(value).format('$1.00 a');
};

export const yahooFinanceLink = (symbol: string): string => {
	symbol = symbol
		.replace('.vn', '.v')
		.replace('.un', '-un')
		.toUpperCase();
	return `https://finance.yahoo.com/quote/${symbol}`;
};

export const coinMarketCapLink = (name: string): string => {
	return `https://coinmarketcap.com/currencies/${name.toLocaleLowerCase()}/`;
};

export const assetLink = (symbol: string, companyName: string, type: AssetType): string => {
	return type === AssetType.stock ? yahooFinanceLink(symbol) : coinMarketCapLink(companyName); 
};

export const coinsPerShare = (symbol: string): number => {
	switch (symbol.toUpperCase()) {
	case 'GBTC':
		return 0.00095023;
	case 'QBTC.TO':
	case 'QBTC.U.TO':
		return 0.001112;
	case 'QETH.U.TO':
		return 0.01777;
	default:
		return 0;
	}
};

export const cryptoPermium = (
	stock: {symbol: string, priceCad: number},
	btcPriceCad: number,
	ethPriceCad: number
): number => {
	const cps = coinsPerShare(stock.symbol);

	if (!cps) {
		return 0;
	}

	const price = _.includes(['QETH.U.TO'], stock.symbol.toUpperCase()) ? ethPriceCad : btcPriceCad;
	const nav = cps * price;

	console.log(cps, price, nav, stock.priceCad);

	return (stock.priceCad - nav) / nav;
};