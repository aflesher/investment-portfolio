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
				action: string
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

export const CapitalGains: React.FC<ICapitalGainsQuery> = ({ data }) => {
	const [year, setYear] = React.useState(new Date().getFullYear());
	const ratesMap: {[key: string]: number} = {};
	data.allExchangeRate.nodes.forEach(rate => {
		ratesMap[rate.date] = rate.rate;
	});

	const getConversion = (trade: {currency: Currency, price: number, timestamp: number}): number => {
		const date = moment(trade.timestamp).startOf('day').format('YYYY-MM-DD');
		return ratesMap[date];
	};

	const trades = data.allTrade.nodes.map(trade => ({
		...trade,
		priceCad: trade.currency === Currency.cad ? trade.price : getConversion(trade)
	}));

	
	render() {
		const capitalGains = _.filter(this.trades, trade => {
			return trade.action == 'sell' && this.state.year == new Date(trade.date).getFullYear();
		});

		const totalGains = _.sumBy(capitalGains, 'gains');
		const totalProceeds = _.sumBy(capitalGains, 'proceeds');
		const totalCost = _.sumBy(capitalGains, 'cost');
		const rows = capitalGains.map((capitalGain, i) =>
			<div className='row' key={i}>
				<div className='col-2'>{capitalGain.symbol}</div>
				<div className='col-2'>{numeral(capitalGain.quantity).format('0,0')}</div>
				<div className='col-2'>{numeral(capitalGain.cost).format('$0,0.00')}</div>
				<div className='col-2'>{numeral(capitalGain.proceeds).format('$0,0.00')}</div>
				<div className='col-2'>{numeral(capitalGain.gains).format('$0,0.00')}</div>
			</div>
		);

		return (
			<Layout>
				<div className='p-4'>
					<div className='row'>
						<div className='col-md-3'>
							<div className='form-group'>
								<label htmlFor='shares'>Year</label>
								<select
									name='year'
									value={this.state.year}
									onChange={e => this.setState({year: parseInt(e.target.value)})}
									className='form-control'
								>
									{this.years.map(year =>
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
					{rows}
					<div className='row font-weight-bold border-t pt-2 mt-2'>
						<div className='col-2 offset-4'>
							{numeral(totalCost).format('$0,0.00')}
						</div>
						<div className='col-2'>
							{numeral(totalProceeds).format('$0,0.00')}
						</div>
						<div className='col-2'>
							{numeral(totalGains).format('$0,0.00')}
						</div>
					</div>
				</div>
			</Layout>
		);
	}
}

export default CapitalGains;

export const pageQuery = graphql`
query {
	allTrade(filter: {accountId: {eq: "26418215"}}) {
		nodes {
			symbol
			quantity
			price
			pnl
			timestamp
			currency
			action
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