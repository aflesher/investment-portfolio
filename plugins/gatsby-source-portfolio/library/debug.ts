import * as questrade from './questrade';

export const querySymbol = async (symbol: string) => {
	const result = await questrade.querySymbol(symbol);
	console.log(`query ${symbol}`.green);
	console.log('>>>>>>>>>>>>'.green);
	console.log(result);
	console.log('<<<<<<<<<<<<'.green);
};
