import { ITrade } from '../../../declarations';
import { getTrades as getQuestradeTrades } from './questrade';
import { getTrades as getFirebaseTrades } from './firebase';

export const getTrades = async (): Promise<ITrade[]> => {
	console.log('trades.getTrades (start)'.gray);
	const [firebaseTrades, questradeTrades] = await Promise.all([
		getFirebaseTrades(),
		getQuestradeTrades(),
	]);

	console.log('trades.getTrades (end)'.gray);
	return [...firebaseTrades, ...questradeTrades].sort(
		(a, b) => a.timestamp - b.timestamp
	);
};
