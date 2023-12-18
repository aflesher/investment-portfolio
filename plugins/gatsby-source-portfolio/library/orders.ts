import { getOrders as getKrakenOrders } from './kraken';
import { getOrders as getQuestradeOrders } from './questrade';

export const getOrders = async () => {
	const [krakenOrders, questradeOrders] = await Promise.all([
		getKrakenOrders(),
		getQuestradeOrders(),
	]);

	return [...krakenOrders, ...questradeOrders];
};
