import { ITrade } from '../../../declarations';
import { getTrades as getQuestradeTrades } from './questrade';
import { getTrades as getFirebaseTrades } from './firebase';
import { getTrades as getKrakenTrades } from './kraken';
import { SYMBOL_FILTER } from './filter';

export const getTrades = async (): Promise<ITrade[]> => {
	console.log('trades.getTrades (start)'.gray);
	const [firebaseTrades, questradeTrades, krakenTrades] = await Promise.all([
		getFirebaseTrades(),
		getQuestradeTrades(),
		getKrakenTrades(),
	]);

	console.log('trades.getTrades (end)'.gray);
	return [...firebaseTrades, ...questradeTrades, ...krakenTrades]
		.sort((a, b) => a.timestamp - b.timestamp)
		.filter((trade) => !SYMBOL_FILTER.includes(trade.symbol));
};
