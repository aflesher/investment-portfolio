import { ITradeV2 } from '../../../declarations';
import { getTrades as getKrakenTrades } from './kraken/kraken';
import { getTrades as getQuestradeTrades } from './questrade/questrade';

export const getTrades = async (): Promise<ITradeV2[]> => {
	const [krakenTrades, questradeTrades] = await Promise.all([
		getKrakenTrades(),
		getQuestradeTrades(),
	]);

	return [...krakenTrades, ...questradeTrades].sort(
		(a, b) => a.timestamp - b.timestamp
	);
};
