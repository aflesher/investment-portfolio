import { graphql, PageProps } from 'gatsby';
import * as React from 'react';
import _ from 'lodash';

import Order from '../components/order/Order';
import Layout from '../components/layout';
import { connect } from 'react-redux';
import { IStoreState } from '../store/store';
import { Currency } from '../utils/enum';

interface IIndexQueryProps extends PageProps {
	data: {
		allOrder: {
			nodes: {
				symbol: string,
				limitPrice: number,
				limitPriceCad: number,
				limitPriceUsd: number,
				openQuantity: number,
				action: string,
				accountName: string,
				quote: {
					price: number,
					afterHoursPrice: number,
				}
				company: {
					name: string,
					marketCap: number
				}
				position?: {
					quantity: number,
					totalCost: number
				}
			}[]
		},
		allNote: {
			nodes: {
				text: string
			}[]
		}
	}
}

interface IIndexStateProps {
	currency: Currency
}


const mapStateToProps = ({ currency }: IStoreState): IIndexStateProps => ({
	currency
});

const IndexPage: React.FC<IIndexQueryProps & IIndexStateProps> = ({ data, currency }) => {
	const notes = _.sampleSize(data.allNote.nodes, data.allNote.nodes.length);
	return (
		<Layout>
			<h1>Orders</h1>
			{data.allOrder.nodes.map((order, index) => (
				<Order
					key={`${order.symbol}${index}`}
					{...order}
					positionQuantity={order.position?.quantity || 0}
					positionCost={order.position?.totalCost || 0}
					quotePrice={order.quote.price}
					currency={currency}
				/>
			))}
			{notes.map(({text}) => (
				<div key={text} className='daily-note text-center b-1 py-2 px-4 mt-4'>
					{text}
				</div>
			))}
		</Layout>
	);
};

export default connect(mapStateToProps)(IndexPage);

export const pageQuery = graphql`
	query {
		allOrder{
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
		allNote {
			nodes {
				text
			}
		}
	}
	`;
