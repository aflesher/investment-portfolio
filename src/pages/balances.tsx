import React from 'react';
import { graphql } from 'gatsby';
import numeral from 'numeral';
import {
	IAccount,
	ICompany,
	IOrder,
	IPosition,
	IQuote,
} from '../../declarations';
import Balance, { IBalanceStateProps } from '../components/balance/Balance';
import { Currency } from '../utils/enum';
import Layout from '../components/layout';

interface IAccountPosition
	extends Pick<IPosition, 'symbol' | 'currency' | 'accounts' | 'company'> {}

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
		| 'currency'
	> {
	quote: Pick<IQuote, 'price' | 'afterHoursPrice'>;
	company: Pick<ICompany, 'name' | 'marketCap'>;
	position?: Pick<IPosition, 'quantity' | 'totalCost'>;
}

interface IBalancesQuery {
	data: {
		allAccount: {
			nodes: IAccount[];
		};
		allPosition: {
			nodes: IAccountPosition[];
		};
		allQuote: {
			nodes: Pick<
				IQuote,
				'symbol' | 'price' | 'priceCad' | 'priceUsd' | 'currency'
			>[];
		};
		allOrder: {
			nodes: IOrderNode[];
		};
	};
}

const Balances: React.FC<IBalancesQuery> = ({ data }) => {
	const positions = data.allPosition.nodes;
	const orders = data.allOrder.nodes;
	const balances: IBalanceStateProps[] = data.allAccount.nodes.map((account) => {
		const amountCad =
			account.balances.find((q) => q.currency === Currency.cad)?.amount || 0;
		const amountUsd =
			account.balances.find((q) => q.currency === Currency.usd)?.amount || 0;
		const cadHisaPositions = positions
			.filter((q) => q.currency === Currency.cad && q.company?.hisa)
			.map((q) => q.accounts)
			.flat()
			.filter((q) => q.accountId === account.accountId);
		const usdHisaPositions = positions
			.filter((q) => q.currency === Currency.usd && q.company?.hisa)
			.map((q) => q.accounts)
			.flat()
			.filter((q) => q.accountId === account.accountId);

		const cadHISA = cadHisaPositions.reduce(
			(sum, q) => sum + q.currentMarketValueCad,
			0
		);
		const usdHISA = usdHisaPositions.reduce(
			(sum, q) => sum + q.currentMarketValueUsd,
			0
		);
		const combinedCadHISA =
			usdHisaPositions.reduce((sum, q) => sum + q.currentMarketValueCad, 0) +
			cadHISA;
		const combinedUsdHISA =
			cadHisaPositions.reduce((sum, q) => sum + q.currentMarketValueUsd, 0) +
			usdHISA;
		const amountUsdInCad =
			account.balances.find((q) => q.currency === Currency.usd)?.amountCad || 0;
		const amountCadInUsd =
			account.balances.find((q) => q.currency === Currency.cad)?.amountUsd || 0;
		const combinedCad = amountCad + amountUsdInCad + combinedCadHISA;
		const combinedUsd = amountUsd + amountCadInUsd + combinedUsdHISA;

		const ordersCad = orders
			.filter(
				(q) => q.accountId === account.accountId && q.currency === Currency.cad
			)
			.reduce(
				(sum, q) =>
					sum + q.limitPrice * q.openQuantity * (q.action === 'sell' ? -1 : 1),
				0
			);

		const ordersUsd = orders
			.filter(
				(q) => q.accountId === account.accountId && q.currency === Currency.usd
			)
			.reduce(
				(sum, q) =>
					sum + q.limitPrice * q.openQuantity * (q.action === 'sell' ? -1 : 1),
				0
			);

		const balance: IBalanceStateProps = {
			name: account.displayName,
			amountCad,
			amountUsd,
			cadHISA,
			usdHISA,
			combinedCadHISA,
			combinedUsdHISA,
			combinedCad,
			combinedUsd,
			ordersDeltaCad: ordersCad ? amountCad - ordersCad : 0,
			ordersDeltaUsd: ordersUsd ? amountUsd - ordersUsd : 0,
		};

		return balance;
	});

	const combinedBalances = {
		amountCad: balances.reduce((sum, { amountCad }) => sum + amountCad, 0),
		amountUsd: balances.reduce((sum, { amountUsd }) => sum + amountUsd, 0),
		savingsAmountCad: 0,
		savingsAmountUsd: 0,
		cadHISA: balances.reduce((sum, { cadHISA }) => sum + (cadHISA || 0), 0),
		usdHISA: balances.reduce((sum, { usdHISA }) => sum + (usdHISA || 0), 0),
		combinedCadHISA: balances.reduce(
			(sum, { combinedCadHISA }) => sum + (combinedCadHISA || 0),
			0
		),
		combinedUsdHISA: balances.reduce(
			(sum, { combinedUsdHISA }) => sum + (combinedUsdHISA || 0),
			0
		),
		combinedCad: balances.reduce((sum, { combinedCad }) => sum + combinedCad, 0),
		combinedUsd: balances.reduce((sum, { combinedUsd }) => sum + combinedUsd, 0),
		name: 'Combined',
	};
	const format = '$0,0.00';
	console.log(balances);

	return (
		<Layout>
			<div className='p-4'>
				<div className='row'>
					{balances
						.filter((q) => !!q.combinedCad)
						.map((balance) => (
							<div className='col-4' key={balance.name}>
								<Balance {...balance} />
							</div>
						))}
				</div>
				<div className='row'>
					<div className='col-12' key={combinedBalances.name}>
						<div className='py-4 my-1 pl-4 border'>
							<div className='row text-emphasis'>
								<div className='col-6'>Account:</div>
								<div className='col-6'>{combinedBalances.name}</div>
							</div>
							<div className='row'>
								<div className='col-6'>$CAD (Exchange Cash)</div>
								<div className='col-6'>
									{numeral(combinedBalances.amountCad).format(format)}
								</div>
							</div>
							<div className='row'>
								<div className='col-6'>$USD (Exchange Cash)</div>
								<div className='col-6'>
									{numeral(combinedBalances.amountUsd).format(format)}
								</div>
							</div>
							<div className='row'>
								<div className='col-6'>$CAD (Savings Accounts)</div>
								<div className='col-6'>
									{numeral(combinedBalances.savingsAmountCad).format(format)}
								</div>
							</div>
							<div className='row'>
								<div className='col-6'>$USD (Savings Accounts)</div>
								<div className='col-6'>
									{numeral(combinedBalances.savingsAmountUsd).format(format)}
								</div>
							</div>
							<div className='row'>
								<div className='col-6'>$CAD (HISA Stock)</div>
								<div className='col-6'>
									{numeral(combinedBalances.cadHISA).format(format)}
								</div>
							</div>
							<div className='row'>
								<div className='col-6'>$USD (HISA Stocks)</div>
								<div className='col-6'>
									{numeral(combinedBalances.usdHISA).format(format)}
								</div>
							</div>
							<div className='row'>
								<div className='col-6'>$CAD (Combined HISA Stocks)</div>
								<div className='col-6'>
									{numeral(combinedBalances.combinedCadHISA).format(format)}
								</div>
							</div>
							<div className='row'>
								<div className='col-6'>$USD (Combined HISA Stocks)</div>
								<div className='col-6'>
									{numeral(combinedBalances.combinedUsdHISA).format(format)}
								</div>
							</div>
							<div className='row text-subtle'>
								<div className='col-6'>$CAD COMBINED TOTAL</div>
								<div className='col-6'>
									{numeral(combinedBalances.combinedCad).format(format)}
								</div>
							</div>
							<div className='row text-subtle'>
								<div className='col-6'>$USD COMBINED TOTAL</div>
								<div className='col-6'>
									{numeral(combinedBalances.combinedUsd).format(format)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default Balances;

export const pageQuery = graphql`
	query {
		allAccount {
			nodes {
				accountId
				displayName
				name
				isTaxable
				balances {
					amount
					amountCad
					amountUsd
					currency
				}
			}
		}
		allQuote(filter: { company: { hisa: { eq: true } } }) {
			nodes {
				price
				priceCad
				priceUsd
				symbol
				currency
			}
		}
		allPosition {
			nodes {
				accounts {
					accountId
					averageEntryPrice
					quantity
					averageEntryPriceCad
					averageEntryPriceUsd
					currentMarketValue
					currentMarketValueCad
					currentMarketValueUsd
					openPnl
					openPnlCad
					openPnlUsd
					totalCost
					totalCostCad
					totalCostUsd
				}
				symbol
				currency
				company {
					hisa
				}
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
				currency
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
