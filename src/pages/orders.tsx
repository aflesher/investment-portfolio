import React, { useContext } from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';

import Order from '../components/order/Order';
import Layout from '../components/layout';
import { IOrder } from '../../declarations/order';
import { IQuote } from '../../declarations/quote';
import { ICompany } from '../../declarations/company';
import { IPosition } from '../../declarations/position';
import { CurrencyContext } from '../context/currency.context';
import { IAccount } from '../../declarations';

interface IOrderNode
	extends Pick<
		IOrder,
		| 'symbol'
		| 'limitPrice'
		| 'limitPriceCad'
		| 'limitPriceUsd'
		| 'openQuantity'
		| 'action'
		| 'accountId'
		| 'virtual'
	> {
	quote: Pick<IQuote, 'price' | 'afterHoursPrice'>;
	company: Pick<ICompany, 'name' | 'marketCap'>;
	position?: Pick<IPosition, 'quantity' | 'totalCost'>;
}

interface IOrdersQueryProps {
	data: {
		allOrder: {
			nodes: IOrderNode[];
		};
		allPosition: {
			nodes: Pick<IPosition, 'quantity' | 'totalCost' | 'symbol'>[];
		};
		allAccount: {
			nodes: Pick<IAccount, 'displayName' | 'accountId'>[];
		};
	};
}

const Orders: React.FC<IOrdersQueryProps> = ({ data }) => {
	const orders = _.orderBy(
		data.allOrder.nodes,
		({ action, quote, limitPrice }) =>
			action == 'buy'
				? (quote.price - limitPrice) / quote.price
				: (limitPrice - quote.price) / quote.price
	);
	const positions = data.allPosition.nodes;
	const currency = useContext(CurrencyContext);
	const accounts = data.allAccount.nodes;
	const openOrders = orders.filter(({ virtual }) => !virtual);
	const virtualOrders = orders.filter(({ virtual }) => virtual);
	return (
		<Layout>
			<div className='p-4'>
				{openOrders.map((order, index) => (
					<Order
						key={`${order.symbol}${index}`}
						{...order}
						positionQuantity={
							positions.find(({ symbol }) => order.symbol === symbol)?.quantity || 0
						}
						positionCost={
							positions.find(({ symbol }) => order.symbol === symbol)?.totalCost || 0
						}
						quotePrice={order.quote.price}
						currency={currency}
						accountName={
							accounts.find(({ accountId }) => order.accountId === accountId)
								?.displayName || ''
						}
					/>
				))}
				<h3 className='mt-4 mb-2'>Virtual Orders</h3>
				{virtualOrders.map((order, index) => (
					<Order
						key={`${order.symbol}${index}`}
						{...order}
						positionQuantity={
							positions.find(({ symbol }) => order.symbol === symbol)?.quantity || 0
						}
						positionCost={
							positions.find(({ symbol }) => order.symbol === symbol)?.totalCost || 0
						}
						quotePrice={order.quote.price}
						currency={currency}
						accountName={
							accounts.find(({ accountId }) => order.accountId === accountId)
								?.displayName || ''
						}
					/>
				))}
			</div>
		</Layout>
	);
};

export default Orders;

export const pageQuery = graphql`
	query {
		allOrder {
			nodes {
				symbol
				limitPrice
				limitPriceCad
				limitPriceUsd
				openQuantity
				action
				accountId
				virtual
				quote {
					price
					afterHoursPrice
				}
				company {
					name
					marketCap
				}
				position {
					quantity
					totalCost
				}
			}
		}
		allPosition {
			nodes {
				symbol
				quantity
				totalCost
			}
		}
		allAccount {
			nodes {
				displayName
				accountId
			}
		}
	}
`;
