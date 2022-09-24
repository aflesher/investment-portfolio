import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import { connect } from 'react-redux';

import Order from '../components/order/Order';
import { IStoreState } from '../store/store';
import { Currency } from '../utils/enum';
import Layout from '../components/layout';

interface IOrdersStateProps {
	currency: Currency;
}

interface IOrdersQueryProps {
	data: {
		allOrder: {
			nodes: {
				symbol: string;
				limitPrice: number;
				limitPriceCad: number;
				limitPriceUsd: number;
				openQuantity: number;
				action: string;
				accountName: string;
				quote: {
					price: number;
					afterHoursPrice: number;
				};
				company: {
					name: string;
					marketCap: number;
				};
				position?: {
					quantity: number;
					totalCost: number;
				};
			}[];
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
	return (
		<Layout>
			<div className='p-4'>
				{orders.map((order, index) => (
					<Order
						key={`${order.symbol}${index}`}
						{...order}
						positionQuantity={order.position?.quantity || 0}
						positionCost={order.position?.totalCost || 0}
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
	}
`;
