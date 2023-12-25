import { ITradeV2 } from '../../../declarations';
import { getTrades as getKrakenTrades } from './kraken';
import { getTrades as getQuestradeTrades } from './questrade';

export const getTrades = async (): Promise<ITradeV2[]> => {
	console.log('trades.getTrades (start)'.gray);
	const [krakenTrades, questradeTrades] = await Promise.all([
		getKrakenTrades(),
		getQuestradeTrades(),
	]);

	console.log('trades.getTrades (end)'.gray);
	return [...krakenTrades, ...questradeTrades].sort(
		(a, b) => a.timestamp - b.timestamp
	);
};
