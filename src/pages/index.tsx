import { graphql, PageProps } from 'gatsby';
import * as React from 'react';
import _ from 'lodash';

import Layout from '../components/layout';
import CompanyBanner from '../components/company-banner/CompanyBanner';
import { compareNumber } from '../utils/util';
import moment from 'moment-timezone';
import Order from '../components/order/Order';
import { IPosition } from '../../declarations/position';
import { CurrencyContext } from '../context/currency.context';
import { IAccount } from '../../declarations';

interface IIndexQueryProps extends PageProps {
	data: {
		allReview: {
			nodes: {
				comments: string;
				continue: string[];
				goals: string[];
				grade: string;
				hightlights: string[];
				lowlights: string[];
				start: string[];
				stop: string[];
				year: number;
			}[];
		};
		allNote: {
			nodes: {
				text: string;
			}[];
		};
		allEarningsDate: {
			nodes: {
				symbol: string;
				date: string;
			}[];
		};
		allOrder: {
			nodes: {
				symbol: string;
				limitPrice: number;
				limitPriceCad: number;
				limitPriceUsd: number;
				openQuantity: number;
				action: string;
				accountId: string;
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
		allPosition: {
			nodes: Pick<IPosition, 'quantity' | 'totalCost' | 'symbol'>[];
		};
		allAccount: {
			nodes: IAccount[];
		};
	};
}

const IndexPage: React.FC<IIndexQueryProps> = ({ data }) => {
	const currency = React.useContext(CurrencyContext);
	const notes = _.sampleSize(data.allNote.nodes, data.allNote.nodes.length);
	const review = _.first(data.allReview.nodes);
	const random = _.random(1, 3);
	const earningsDates = data.allEarningsDate.nodes
		.sort((a, b) => compareNumber(moment(a.date).unix(), moment(b.date).unix()))
		.filter(({ date }) => moment(date).diff(moment(), 'days') >= 0)
		.slice(0, 5);
	const positions = data.allPosition.nodes;
	const orders = _.orderBy(
		data.allOrder.nodes,
		({ action, quote, limitPrice }) =>
			action == 'buy'
				? (quote.price - limitPrice) / quote.price
				: (limitPrice - quote.price) / limitPrice
	).filter(({ action, quote, limitPrice }) => {
		const gap =
			action == 'buy'
				? (quote.price - limitPrice) / quote.price
				: (limitPrice - quote.price) / quote.price;
		return gap < 0.05;
	});
	return (
		<Layout>
			<div className='row p-4'>
				<div className='col-12'>
					{random === 1 &&
						review?.continue.map((c) => (
							<div key={c}>
								<span>
									<i className='fas fa-sync-alt mr-2 blue-color'></i>
								</span>
								<span>{c}</span>
							</div>
						))}
					{random === 2 &&
						review?.start.map((s) => (
							<div key={s}>
								<span>
									<i className='fas fa-play mr-2 green-color'></i>
								</span>
								<span>{s}</span>
							</div>
						))}
					{random === 3 &&
						review?.stop.map((s) => (
							<div key={s}>
								<span>
									<i className='fas fa-stop mr-2 red-color'></i>
								</span>
								<span>{s}</span>
							</div>
						))}
				</div>
			</div>
			{_.sampleSize(notes, 1).map(({ text }) => (
				<div key={text} className='daily-note text-center b-1 py-2 px-4 mt-4'>
					{text}
				</div>
			))}
			<div className='mx-2 mt-4'>
				<h3>Upcoming Earnings</h3>
				{earningsDates.map(({ date, symbol }) => (
					<div
						className='row my-2 home-page-earnings-wrapper'
						key={`${symbol}${date}`}
					>
						<div className='home-page-earnings col-3'>
							<CompanyBanner
								symbol={symbol}
								name={`$${symbol.toUpperCase().replace('.TO', '')}`}
								isNotBanner={true}
							/>
						</div>
						<div className='pl-4 col-9' style={{ lineHeight: 2.3 }}>
							{moment(date).format('ddd, MMM DD YYYY')}&nbsp;
							<i>
								({moment(date).startOf('day').diff(moment().startOf('day'), 'days')}{' '}
								days away)
							</i>
						</div>
					</div>
				))}
			</div>
			<div className='mx-2 pt-4'>
				<h3>Close Orders</h3>
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
						accountName={
							data.allAccount.nodes.find(
								({ accountId }) => order.accountId === accountId
							)?.displayName || ''
						}
					/>
				))}
			</div>
		</Layout>
	);
};

export default IndexPage;

export const pageQuery = graphql`
	query {
		allReview(sort: { fields: year, order: ASC }, limit: 1) {
			nodes {
				comments
				continue
				goals
				grade
				highlights
				lowlights
				start
				stop
				year
			}
		}
		allNote {
			nodes {
				text
			}
		}
		allEarningsDate {
			nodes {
				symbol
				date
			}
		}
		allOrder {
			nodes {
				symbol
				limitPrice
				limitPriceCad
				limitPriceUsd
				openQuantity
				action
				accountId
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
				name
				isTaxable
				type
				balances {
					amount
					amountCad
					amountUsd
					currency
				}
			}
		}
	}
`;
