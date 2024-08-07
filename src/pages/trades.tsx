import React, { useCallback, useMemo } from 'react';
import { graphql } from 'gatsby';
import { Typeahead } from 'react-bootstrap-typeahead';
import InfiniteScroll from 'react-infinite-scroll-component';

import Trade from '../components/trade/Trade';
import Layout from '../components/layout';
import DateRange from '../components/date-range/DateRange';
import { dateInputFormat } from '../utils/util';
import { IAccount, ITrade } from '../../declarations';

interface ITradeNode
	extends Pick<
		ITrade,
		| 'accountId'
		| 'quantity'
		| 'action'
		| 'price'
		| 'timestamp'
		| 'pnl'
		| 'pnlCad'
		| 'pnlUsd'
		| 'currency'
		| 'symbol'
		| 'type'
	> {}

interface ITradeQuery {
	data: {
		allTrade: {
			nodes: ITradeNode[];
		};
		allAccount: {
			nodes: IAccount[];
		};
	};
}

const PAGE_SIZE = 50;

const Trades: React.FC<ITradeQuery> = ({ data }) => {
	const [startDate, setStartDate] = React.useState(new Date('2011-01-01'));
	const [endDate, setEndDate] = React.useState(new Date());
	const [symbol, setSymbol] = React.useState('');
	const [showLength, setShownLength] = React.useState(PAGE_SIZE);

	const accounts = data.allAccount.nodes;

	const trades = useMemo(
		() =>
			data.allTrade.nodes.filter((trade) => {
				if (startDate && startDate > new Date(trade.timestamp)) {
					return false;
				}

				if (endDate && endDate < new Date(trade.timestamp)) {
					return false;
				}

				if (symbol && !trade.symbol.match(new RegExp(`^${symbol}.*`, 'gi'))) {
					return false;
				}

				return true;
			}),
		[startDate, endDate, symbol, data]
	);

	const symbols = useMemo(
		() =>
			trades
				.map((q) => q.symbol)
				.filter((q, index, array) => array.indexOf(q) === index),
		[trades]
	);

	const handleSymbolChange = useCallback(
		(symbol: string): void => {
			setSymbol(symbol);
		},
		[setSymbol]
	);

	const handleStartDateChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			setStartDate(new Date(event.target.value));
		},
		[setStartDate]
	);

	const handleEndDateChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			setEndDate(new Date(event.target.value));
		},
		[setEndDate]
	);

	const handleDateRangeChange = useCallback(
		(start: Date, end: Date): void => {
			setStartDate(start);
			setEndDate(end);
		},
		[setStartDate, setEndDate]
	);

	return (
		<Layout>
			<div className='activity p-4'>
				<div className='row'>
					<div className='col-3'>
						<div className='form-group'>
							<label htmlFor='symbol'>Symbol</label>
							<Typeahead
								onChange={(symbols): void => handleSymbolChange(symbols[0] as string)}
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
							<label>End</label>
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
				<div>
					<InfiniteScroll
						dataLength={Math.min(showLength, trades.length)}
						next={() => setShownLength(showLength + PAGE_SIZE)}
						hasMore={showLength < trades.length}
						loader={<></>}
					>
						{trades.slice(0, showLength).map((trade, index) => (
							<Trade
								key={`${trade.symbol}${index}`}
								symbol={trade.symbol}
								quantity={trade.quantity}
								timestamp={trade.timestamp}
								pnlCad={trade.pnlCad}
								pnlUsd={trade.pnlUsd}
								price={trade.price}
								isSell={trade.action === 'sell'}
								currency={trade.currency}
								accountName={
									accounts.find((q) => q.accountId === trade.accountId)?.displayName ||
									''
								}
								type={trade.type}
							/>
						))}
					</InfiniteScroll>
				</div>
			</div>
		</Layout>
	);
};

export default Trades;

export const pageQuery = graphql`
	query {
		allTrade(sort: { timestamp: DESC }) {
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
				type
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
