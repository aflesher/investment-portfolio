import React from 'react';
import numeral from 'numeral';
import { graphql } from 'gatsby';
import _ from 'lodash';
import moment from 'moment';

import Layout from '../../components/layout';
import { Currency } from '../../utils/enum';

interface ICapitalGainsQuery {
	data: {
		allTrade: {
			nodes: {
				symbol: string,
				quantity: number,
				price: number,
				pnl: number,
				timestamp: number,
				currency: Currency,
				action: string,
				exchange?: {
					rate: number
				}
			}[]
		},
		allExchangeRate: {
			nodes: {
				date: string,
				rate: number
			}[]
		}
	}
}

interface ICapitalGains {
	cost: number,
	proceeds: number,
	symbol: string,
	shares: number
}

const years = [2019, 2020, 2021];

const CapitalGains: React.FC<ICapitalGainsQuery> = ({ data }) => {
	const [year, setYear] = React.useState(new Date().getFullYear());
	const ratesMap: {[key: string]: number} = {};
	data.allExchangeRate.nodes.forEach(rate => {
		ratesMap[rate.date] = rate.rate;
	});

	// FYI I'm sure this is why captial gains aren't always working. The date conversion.
	// custom rates
	ratesMap['2021-01-07'] = 1.27;

	const getConversion = (trade: {currency: Currency, price: number, timestamp: number}): number => {
		if (trade.currency === Currency.cad) {
			return 1;
		}
		const date = moment(trade.timestamp).startOf('day').format('YYYY-MM-DD');
		return ratesMap[date];
	};

	const trades = data.allTrade.nodes
		.map(trade => ({
			...trade,
			priceCad: trade.currency === Currency.cad ? trade.price : getConversion(trade)
		}));

	const groupedTrades = _.groupBy(trades, t => t.symbol);
	const filteredGroupedTrades = _.filter(
		groupedTrades,
		trades => !!_.find(
			trades,
			t => t.action === 'sell' && moment(t.timestamp).year() === year && !t.symbol.match(/dlr/)
		)
	);

	const capitalGains: ICapitalGains[] = [];

	_.forEach(filteredGroupedTrades, trades => {
		const orderedTrades = _.orderBy(trades, t => t.timestamp);
		let shares = 0;
		let cost = 0;

		orderedTrades.forEach(t => {
			if (t.action === 'buy') {
				cost += t.quantity * t.price * getConversion(t);
				shares += t.quantity;
			} else {
				const proceeds = t.quantity * t.price * getConversion(t);
				const tradeCost = (cost / shares) * t.quantity;
				if (moment(t.timestamp).year() === year) {
					capitalGains.push({
						proceeds,
						cost: tradeCost,
						symbol: t.symbol,
						shares: t.quantity
					});
				}
				cost -= tradeCost;
				shares -= t.quantity;
			}
		});
	});

	return (
		<Layout>
			<div className='p-4'>
				<div className='row'>
					<div className='col-md-3'>
						<div className='form-group'>
							<label htmlFor='shares'>Year</label>
							<select
								name='year'
								value={year}
								onChange={e => setYear(parseInt(e.target.value))}
								className='form-control'
							>
								{years.map(year =>
									<option key={year} value={year}>
										{year}
									</option>
								)}
							</select>
						</div>
					</div>
				</div>
				<div className='row font-weight-bold border-b mb-2 pb-2'>
					<div className='col-2'>Symbol</div>
					<div className='col-2'>Shares</div>
					<div className='col-2'>Cost</div>
					<div className='col-2'>Proceeds</div>
					<div className='col-2'>Gains</div>
				</div>
				{capitalGains.map((c, i) => (
					<div className='row' key={i}>
						<div className='col-2'>{c.symbol}</div>
						<div className='col-2'>{numeral(c.shares).format('0,0')}</div>
						<div className='col-2'>{numeral(c.cost).format('$0,0.00')}</div>
						<div className='col-2'>{numeral(c.proceeds).format('$0,0.00')}</div>
						<div className='col-2'>{numeral(c.proceeds - c.cost).format('$0,0.00')}</div>
					</div>
				))}
				<div className='row font-weight-bold border-t pt-2 mt-2'>
					<div className='col-2 offset-4'>
						{numeral(_.sumBy(capitalGains, c => c.cost)).format('$0,0.00')}
					</div>
					<div className='col-2'>
						{numeral(_.sumBy(capitalGains, c => c.proceeds)).format('$0,0.00')}
					</div>
					<div className='col-2'>
						{numeral(
							_.sumBy(capitalGains, c => c.proceeds) -
							_.sumBy(capitalGains, c => c.cost)
						).format('$0,0.00')}
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default CapitalGains;

export const pageQuery = graphql`
query {
	allTrade(filter: {taxable: {eq: true}}) {
		nodes {
			symbol
			quantity
			price
			pnl
			timestamp
			currency
			action
			exchange {
				rate
			}
		}
	}
	allExchangeRate(filter: {key: {eq: "USD_CAD"}}) {
		nodes {
			date
			rate
		}
  }
}
`;