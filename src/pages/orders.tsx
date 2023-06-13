import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import { connect } from 'react-redux';

import Order from '../components/order/Order';
import { IStoreState } from '../store/store';
import { Currency } from '../utils/enum';
import Layout from '../components/layout';
import { IOrder } from '../utils/order';
import { IQuote } from '../utils/quote';
import { ICompany } from '../utils/company';
import { IPosition } from '../utils/position';

interface IOrdersStateProps {
	currency: Currency;
}

interface IOrderNode
	extends Pick<
		IOrder,
		| 'symbol'
		| 'limitPrice'
		| 'limitPriceCad'
		| 'limitPriceUsd'
		| 'openQuantity'
		| 'action'
		| 'accountName'
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
	};
}

const mapStateToProps = ({ currency }: IStoreState): IOrdersStateProps => ({
	currency,
});

const Orders: React.FC<IOrdersStateProps & IOrdersQueryProps> = ({
	currency,
	data,
}) => {
	const orders = _.orderBy(
		data.allOrder.nodes,
		({ action, quote, limitPrice }) =>
			action == 'buy'
				? (quote.price - limitPrice) / quote.price
				: (limitPrice - quote.price) / quote.price
	);
	const positions = data.allPosition.nodes;
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
					/>
				))}
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps, null)(Orders);

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
				accountName
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
