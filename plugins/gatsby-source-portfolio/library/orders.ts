import { getOrders as getKrakenOrders } from './kraken';
import { getOrders as getQuestradeOrders } from './questrade';

export const getOrders = async () => {
	console.log('orders.getOrders (start)'.gray);
	const [krakenOrders, questradeOrders] = await Promise.all([
		getKrakenOrders(),
		getQuestradeOrders(),
	]);
	console.log('orders.getOrders (end)'.gray);

	return [...krakenOrders, ...questradeOrders];
};
