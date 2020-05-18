import numeral from 'numeral';
import moment from 'moment-timezone';

export const displayMarketCap = (value: number): string => numeral(value).format('$1.00 a');

export const faClassForSymbol = (symbol: string): string => {
	const lookup: any = {
		btc: 'fab fa-btc mr-2',
		xmr: 'fab fa-monero mr-2',
		eth: 'fab fa-ethereum mr-2',
		amzn: 'fab fa-amazon mr-2',
		fb: 'fab fa-facebook-f mr-2',
		pins: 'fab fa-pinterest-p mr-2',
	};

	return lookup[symbol] || '';
};

export const formatDateShort = (timestamp: number): string => {
	return moment(timestamp)
		.tz('America/New_York')
		.format('MMM DD `YY');
};