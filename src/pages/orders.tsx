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
import { IAccount } from '../../declarations/account';

interface IOrderNode
	extends Pick<
		IOrder,
		| 'symbol'
		| 'limitPrice'
		| 'limitPriceCad'
		| 'limitPriceUsd'
		| 'openQuantity'
		| 'action'
	> {
	quote: Pick<IQuote, 'price' | 'afterHoursPrice'>;
	company: Pick<ICompany, 'name' | 'marketCap'>;
	position?: Pick<IPosition, 'quantity' | 'totalCost'>;
	account: Pick<IAccount, 'displayName'>;
}

interface IOrdersQueryProps {
	data: {
		allOrder: {
			nodes: IOrderNode[];
		};
		allPosition: {
			nodes: Pick<IPosition, 'quantity' | 'totalCost' | 'symbol'>[];
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
	return (
		<Layout>
			<div className='p-4'>
				{orders.map((order, index) => (
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
						accountName={order.account.displayName}
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
				account {
					displayName
				}
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
	}
`;
