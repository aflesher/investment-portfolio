import { ICloudTrade } from './cloud';

export const getCustomTrades = (): ICloudTrade[] => [
	{
		symbol: 'spy17apr20p200.00',
		date: new Date('2020-04-20'),
		accountId: 51637118,
		action: 'sell',
		symbolId: 27994113,
		currency: 'usd',
		price: 0,
		quantity: 12,
		type: 'stock',
		hash: '',
		pnl: -1152,
	},
	{
		symbol: 'trst.to',
		date: new Date('2020-12-30'),
		accountId: 51637118,
		action: 'sell',
		symbolId: 18521745,
		currency: 'cad',
		price: 0,
		quantity: 480,
		type: 'stock',
		hash: '',
		pnl: -4963.2,
	},
	{
		symbol: 'qbtc.u.to',
		date: new Date('2021-01-08'),
		accountId: 26418215,
		action: 'buy',
		symbolId: 30032314,
		currency: 'usd',
		price: 46,
		quantity: 512,
		type: 'stock',
		hash: '',
		pnl: 0,
	},
	{
		symbol: 'scr.to',
		date: new Date('2021-10-22'),
		accountId: 51443858,
		action: 'sell',
		symbolId: 34561047,
		currency: 'cad',
		price: 44.65,
		quantity: 1492,
		type: 'stock',
		hash: '',
		pnl: 56361.27,
	},
	{
		symbol: 'penn',
		date: new Date('2021-10-22'),
		accountId: 51443858,
		action: 'buy',
		symbolId: 31627,
		currency: 'usd',
		price: 74.63,
		quantity: 356,
		type: 'stock',
		hash: '',
		pnl: 0,
	},
	{
		symbol: 'pins20jan23c55.00',
		date: new Date('2023-01-23'),
		accountId: 26418215,
		action: 'sell',
		symbolId: 32336551,
		currency: 'usd',
		price: 0,
		quantity: 12,
		type: 'stock',
		hash: '',
		pnl: -1044,
	},
	{
		symbol: 'pins20jan23c55.00',
		date: new Date('2023-01-23'),
		accountId: 51443858,
		action: 'sell',
		symbolId: 32336551,
		currency: 'usd',
		price: 0,
		quantity: 13,
		type: 'stock',
		hash: '',
		pnl: -780,
	},
	{
		symbol: 'chal.cn',
		date: new Date('2023-02-16'),
		accountId: 51443858,
		action: 'sell',
		symbolId: 36249972,
		currency: 'cad',
		price: 0,
		quantity: 826,
		type: 'stock',
		hash: '',
		pnl: -1197.7,
	},
	{
		symbol: 'ry.to',
		date: new Date('2019-07-11'),
		accountId: 26418215,
		action: 'sell',
		symbolId: 34658,
		currency: 'cad',
		price: 105.25,
		quantity: 100,
		type: 'stock',
		hash: '',
		pnl: 2279,
	},
];

export const getFilteredSymbolIds = () => [17488686];

export const getMappedSymbolIds = () => [
	{ original: 20682, replacement: 11419766 }, // googl
	{ original: 28114781, replacement: 41822360 },
];

export const getMappedSymbols = () => ({
	'bitf.vn': 'bitf.to',
});
