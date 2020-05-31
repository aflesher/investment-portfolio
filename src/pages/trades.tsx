import React from 'react';
import Paginate from 'react-paginate';
import _ from 'lodash';
import { graphql } from 'gatsby';
import {Typeahead} from 'react-bootstrap-typeahead';
import { connect } from 'react-redux';

import Trade from '../components/trade/Trade';
import Layout from '../components/layout';
import DateRange from '../components/dateRange/DateRange';
import { IStoreState } from '../store/store';
import { Currency } from '../utils/enum';
import { dateInputFormat } from '../utils/util';

interface ITradeProps {
	currency: Currency
}

interface ITradeQuery {
	data: {
		allTrade: {
			nodes: {
				accountId: number,
				quantity: number,
				price: number,
				action: string,
				symbol: string,
				timestamp: number,
				pnl: number,
				pnlCad: number,
				pnlUsd: number,
				currency: Currency,
				company: {
					name: string,
					marketCap: number,
					prevDayClosePrice: number,
					symbol: string,
					yield?: number
				}
				quote: {
					price: number,
					priceUsd: number,
					priceCad: number
				}
			}[]
		}
	}
}

const ACTIONS_PER_PAGE = 15;

const mapStateToProps = ({ currency }: IStoreState): ITradeProps => ({
	currency
});

const Trades: React.FC<ITradeProps & ITradeQuery> = ({ data }) => {
	const [startDate, setStartDate] = React.useState(new Date('2011-01-01'));
	const [endDate, setEndDate] = React.useState(new Date());
	const [symbol, setSymbol] = React.useState('');
	const [page, setPage] = React.useState(0);

	const trades = _.filter(data.allTrade.nodes, trade => {
		if (startDate && startDate > new Date(trade.timestamp)) {
			return false;
		}

		if (endDate && endDate < new Date(trade.timestamp)) {
			return false;
		}

		if (
			symbol &&
			!trade.symbol.match(new RegExp(`^${symbol}.*`, 'gi'))
		) {
			return false;
		}
		
		return true;
	});

	const symbols = _(data.allTrade.nodes).map(t => t.symbol).uniq().value();

	const handleSymbolChange = (symbol: string): void => {
		setSymbol(symbol);
		setPage(0);
	};

	const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		setStartDate(new Date(event.target.value));
		setPage(0);
	};

	const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
		setEndDate(new Date(event.target.value));
		setPage(0);
	};

	const handleDateRangeChange = (start: Date, end: Date): void => {
		setStartDate(start);
		setEndDate(end);
		setPage(0);
	};

	return (
		<Layout>
			<div className='activity p-4'>
				<div className='row'>
					
					<div className='col-3'>
						<div className='form-group'>
							<label htmlFor='symbol'>Symbol</label>
							<Typeahead
								onChange={(symbols): void => handleSymbolChange(symbols[0])}
								onInputChange={(symbol): void => handleSymbolChange(symbol)}
								options={symbols}
								allowNew
								id='symbol'
							/>
						</div>
					</div>

					
					<div className='col-3'>
						<div className='form-group'>
							<label>Start</label>
							<input
								type='date'
								value={dateInputFormat(startDate)}
								onChange={handleStartDateChange}
								className='form-control'
								max={dateInputFormat(new Date())}
							/>
						</div>
					</div>

					<div className='col-3'>
						<div className='form-group'>
							<label>Start</label>
							<input
								type='date'
								value={dateInputFormat(endDate)}
								onChange={handleEndDateChange}
								className='form-control'
								max={dateInputFormat(new Date())}
							/>
						</div>
					</div>

					<div className='col-3'>
						<div className='form-group'>
							<label>Date Range</label>
							<DateRange
								onChange={handleDateRangeChange}
								startDate={startDate}
								endDate={endDate}
							/>
						</div>
					</div>
				</div>
				<div className='row'>
					<div className='col-12'>
						<div className='paginate d-flex justify-content-center'>
							<Paginate
								pageCount={Math.ceil(trades.length / ACTIONS_PER_PAGE)}
								onPageChange={(resp): void => setPage(resp.selected)}
								nextLabel='>'
								previousLabel='<'
								forcePage={page}
								pageRangeDisplayed={10}
								marginPagesDisplayed={10}
							/>
						</div>
					</div>
				</div>
				<div>
					{trades.map((trade, index) => (
						<Trade
							key={`${trade.symbol}${index}`}
							{...trade}
							{...trade.quote}
							previousClosePrice={trade.company.prevDayClosePrice}
							assetCurrency={trade.currency}
							isSell={trade.action === 'sell'}
							name={trade.company.name}
							marketCap={trade.company.marketCap}
							currency={trade.currency}
						/>
					))}
				</div>
				<div className="text-center mt-2">
					<a onClick={(): void => setPage(page - 1)}>PREVIOUS</a>&nbsp;
					|&nbsp;
					<a onClick={(): void => setPage(page + 1)}>NEXT</a>
				</div>
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps, null)(Trades);

export const pageQuery = graphql`
	query {
		allTrade(sort: {fields: [timestamp], order: DESC}) {
			nodes {
				accountId
				quantity
				price
				action
				symbol
				timestamp
				pnl
				pnlCad
				pnlUsd
				currency
				assessment {
					symbol
					minuses
					pluses
					targetPrice
					targetShares
					notes
					lastUpdatedTimestamp
					assessment
				}
				company {
					name
					marketCap
					prevDayClosePrice
					symbol
					yield
				}
				quote {
					price
					priceUsd
					priceCad
				}
				position {
					quantity
					totalCost
					totalCostUsd
					totalCostCad
					currentMarketValueCad
					currentMarketValueUsd
					averageEntryPrice
					openPnl
					openPnlCad
				}
			}
		}
	}
	`;