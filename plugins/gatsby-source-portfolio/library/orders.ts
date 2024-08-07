import { SYMBOL_FILTER } from './filter';
import { getVirtualOrders, insertVirtualOrdersIntoFirebase } from './firebase';
import { getOrders as getKrakenOrders } from './kraken';
import { getOrders as getQuestradeOrders } from './questrade';

export const getOrders = async () => {
	console.log('orders.getOrders (start)'.gray);
	await insertVirtualOrdersIntoFirebase();
	const [krakenOrders, questradeOrders, virtualOrders] = await Promise.all([
		getKrakenOrders(),
		getQuestradeOrders(),
		getVirtualOrders(),
	]);
	console.log('orders.getOrders (end)'.gray);

	return [...krakenOrders, ...questradeOrders, ...virtualOrders].filter(
		(order) => !SYMBOL_FILTER.includes(order.symbol)
	);
};
