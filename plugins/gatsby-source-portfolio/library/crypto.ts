import axios from 'axios';

export interface ICrypto52Weeks {
	symbol: string;
	low: number;
	high: number;
}

export const scrapeCrypto52Weeks = async (symbol: string) => {
	const response = await axios
		.get(`https://finance.yahoo.com/quote/${symbol.toUpperCase()}-USD/`)
		.catch((error) => {
			console.log(`error ${error}`);
		});

	if (!response?.data) {
		return [0, 0];
	}
	const body: string = response.data;
	const matches = body.match(
		/"FIFTY_TWO_WK_RANGE-value">((\d|,|\.)+)\s-\s((\d|,|\.)+)/
	);
	const low = parseFloat((matches?.[1] || '0').replace(',', ''));
	const high = parseFloat((matches?.[3] || '0').replace(',', ''));
	return [low, high];
};

export const getCrypto52Weeks = (
	symbols: string[]
): Promise<ICrypto52Weeks[]> => {
	return Promise.all(
		symbols.map(async (symbol) => {
			const [low, high] = await scrapeCrypto52Weeks(symbol);
			return { symbol, low, high };
		})
	);
};
