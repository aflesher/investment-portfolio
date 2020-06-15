import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import numeral from 'numeral';

import { Currency } from '../../utils/enum';
import Layout from '../../components/layout';

interface IFinancialsQuery {
	data: {
		allPosition: {
			nodes: {
				totalCostUsd: number,
				totalCostCad: number,
				openPnlCad: number,
				openPnlUsd: number,
				currentMarketValueUsd: number,
				currentMarketValueCad: number,
			}[]
		}
		allTrade: {
			nodes: {
				pnlUsd: number,
				pnlCad: number,
			}[]
		}
		allDividend: {
			nodes: {
				amountUsd: number,
				amountCad: number,
			}[]
		}
		allBalance: {
			nodes: {
				currency: Currency,
				cash: number
			}[]
		}
	}
}

const Financials: React.FC<IFinancialsQuery> = ({ data }) => {
	const positions = data.allPosition.nodes;
	const trades = data.allTrade.nodes;
	const dividends = data.allDividend.nodes;
	const balances = data.allBalance.nodes;

	const equityUsd = _.sumBy(positions, q => q.currentMarketValueUsd);
	const equityCad = _.sumBy(positions, q => q.currentMarketValueCad);

	const openPnlUsd = _.sumBy(positions, q => q.openPnlUsd);
	const openPnlCad = _.sumBy(positions, q => q.openPnlCad);

	const dividendsUsd = _.sumBy(dividends, q => q.amountUsd);
	const dividendsCad = _.sumBy(dividends, q => q.amountCad);

	const closedPnlUsd = _.sumBy(trades, q => q.pnlUsd);
	const closedPnlCad = _.sumBy(trades, q => q.pnlCad);

	const cashUsd = _.find(balances, q => q.currency === Currency.usd)?.cash || 0;
	const cashCad = _.find(balances, q => q.currency === Currency.cad)?.cash || 0;

	const totalUsd = equityUsd + cashUsd;
	const totalCad = equityCad + cashCad;

	return (
		<Layout>
			<div className='p-4 text-right'>
				<div className='row font-weight-bold border-b mb-2 pb-2'>
					<div className='col-3'>Cur.</div>
					<div className='col-3'>Equity</div>
					<div className='col-3'>Cash</div>
					<div className='col-3'>Combined</div>
				</div>
				<div className='row'>
					<div className='col-3'>USD</div>
					<div className='col-3'>
						{numeral(equityUsd).format('$0,0')}
					</div>
					<div className='col-3'>
						{numeral(cashUsd).format('$0,0')}
					</div>
					<div className='col-3'>{numeral(totalUsd).format('$0,0')}</div>
				</div>
				<div className='row'>
					<div className='col-3'>CAD</div>
					<div className='col-3'>
						({numeral(equityUsd/totalUsd).format('0.0%')})&nbsp;
						{numeral(equityCad).format('$0,0')}
					</div>
					<div className='col-3'>
						({numeral(cashUsd/totalUsd).format('0.0%')})&nbsp;
						{numeral(cashCad).format('$0,0')}
					</div>
					<div className='col-3'>{numeral(totalCad).format('$0,0')}</div>
				</div>
			</div>
			<div className='p-4 text-right'>
				<div className='row font-weight-bold border-b mb-2 pb-2'>
					<div className='col-3'>Cur.</div>
					<div className='col-3'>Open PnL</div>
					<div className='col-3'>Closed PnL</div>
					<div className='col-3'>Dividends</div>
				</div>
				<div className='row'>
					<div className='col-3'>USD</div>
					<div className='col-3'>{numeral(openPnlUsd).format('$0,0')}</div>
					<div className='col-3'>{numeral(closedPnlUsd).format('$0,0')}</div>
					<div className='col-3'>{numeral(dividendsUsd).format('$0,0')}</div>
				</div>
				<div className='row'>
					<div className='col-3'>CAD</div>
					<div className='col-3'>{numeral(openPnlCad).format('$0,0')}</div>
					<div className='col-3'>{numeral(closedPnlCad).format('$0,0')}</div>
					<div className='col-3'>{numeral(dividendsCad).format('$0,0')}</div>
				</div>
			</div>
		</Layout>
	);
};

export default Financials;

export const pageQuery = graphql`
	query {
		allPosition {
			nodes {
				totalCostUsd
				totalCostCad
				openPnlCad
				openPnlUsd
				currentMarketValueUsd
				currentMarketValueCad
			}
		}
		allTrade(filter: {action: {eq: "sell"}, pnlUsd: {ne: 0}}) {
			nodes {
				pnlUsd
				pnlCad
			}
		}
		allDividend {
			nodes {
				amountUsd
				amountCad
			}
		}
		allBalance(filter: {combined: {eq: true}}) {
			nodes {
				currency
				cash
			}
		}
	}
`;