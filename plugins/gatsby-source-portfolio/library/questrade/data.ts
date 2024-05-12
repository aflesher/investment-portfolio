import crypto from 'crypto';

import { ICloudTrade } from './cloud';

// I think these can get removed. They are now in the cloud.ts file
// Also, we need to remove the first trade as it is a duplicate now
export const getCustomTrades = (): ICloudTrade[] => {
	const trades: ICloudTrade[] = [
		{
			symbol: 'lulu',
			date: new Date('2021-02-25'),
			accountId: 51637118,
			action: 'buy',
			symbolId: 26052,
			currency: 'usd',
			price: 310,
			quantity: 8,
			type: 'stock',
			hash: '',
			pnl: 0,
		},
	];

	trades.forEach((trade) => {
		const hash = crypto
			.createHash('md5')
			.update(JSON.stringify(trade))
			.digest('hex');
		trade.hash = hash;
	});

	return trades;
};

export const getFilteredSymbolIds = () => [17488686];

export const getMappedSymbolIds = () => [
	{ original: 20682, replacement: 11419766 }, // googl
	{ original: 28114781, replacement: 41822360 },
	{ original: 16529510, replacement: 52040561 },
	{ original: 31181458, replacement: 54301044 }, // hsuv.u.to
	{ original: 38844425, replacement: 54300999 }, // cash.to
];

export const getMappedSymbols = () => ({
	'bitf.vn': 'bitf.to',
	psucf: 'psu.u.to',
});
