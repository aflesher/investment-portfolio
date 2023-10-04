import React, { useCallback, useMemo } from 'react';
import _ from 'lodash';
import { graphql } from 'gatsby';
import { Typeahead } from 'react-bootstrap-typeahead';
import { connect } from 'react-redux';
import InfiniteScroll from 'react-infinite-scroll-component';

import Trade from '../components/trade/Trade';
import Layout from '../components/layout';
import DateRange from '../components/dateRange/DateRange';
import { IStoreState } from '../store/store';
import { Currency, AssetType } from '../utils/enum';
import { dateInputFormat } from '../utils/util';
import { ITrade } from '../../declarations/trade';
import { ICompany } from '../../declarations/company';
import { IQuote } from '../../declarations/quote';
import { IAssessment } from '../../declarations/assessment';
import { IPosition } from '../../declarations/position';

interface ITradeProps {
	currency: Currency;
}

interface ITradeNode
	extends Pick<
		ITrade,
		| 'accountId'
		| 'accountName'
		| 'quantity'
		| 'action'
		| 'price'
		| 'timestamp'
		| 'pnl'
		| 'pnlCad'
		| 'pnlUsd'
		| 'currency'
		| 'symbol'
	> {
	company: Pick<
		ICompany,
		'name' | 'marketCap' | 'prevDayClosePrice' | 'symbol' | 'yield'
	>;
	quote: Pick<IQuote, 'price' | 'priceUsd' | 'priceCad' | 'currency'>;
	assessment?: Pick<
		IAssessment,
		'targetInvestmentProgress' | 'targetPriceProgress' | 'type'
	>;
	position?: Pick<
		IPosition,
		| 'quantity'
		| 'totalCost'
		| 'totalCostUsd'
		| 'totalCostCad'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
		| 'averageEntryPrice'
		| 'openPnl'
		| 'openPnlCad'
		| 'openPnlUsd'
	>;
}

interface ITradeQuery {
	data: {
		allTrade: {
			nodes: ITradeNode[];
		};
	};
}

const mapStateToProps = ({ currency }: IStoreState): ITradeProps => ({
	currency,
});

const PAGE_SIZE = 50;

const Trades: React.FC<ITradeProps & ITradeQuery> = ({ currency, data }) => {
	const [startDate, setStartDate] = React.useState(new Date('2011-01-01'));
	const [endDate, setEndDate] = React.useState(new Date());
	const [symbol, setSymbol] = React.useState('');
	const [showLength, setShownLength] = React.useState(PAGE_SIZE);

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
								{...trade.quote}
								tradePrice={trade.price}
								previousClosePrice={trade.company.prevDayClosePrice}
								assetCurrency={trade.currency}
								isSell={trade.action === 'sell'}
								name={trade.company.name}
								marketCap={trade.company.marketCap}
								currency={trade.currency}
								priceProgress={trade.assessment?.targetPriceProgress || 0}
								shareProgress={trade.assessment?.targetInvestmentProgress || 0}
								type={trade.assessment?.type || AssetType.stock}
								costCad={trade.position?.totalCostCad || 0}
								costUsd={trade.position?.totalCostUsd || 0}
								valueCad={trade.position?.currentMarketValueCad || 0}
								valueUsd={trade.position?.currentMarketValueUsd || 0}
								activeCurrency={currency}
								quoteCurrency={trade.quote.currency}
								accountName={trade.accountName}
							/>
						))}
					</InfiniteScroll>
				</div>
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps, null)(Trades);

export const pageQuery = graphql`
	query {
		allTrade(sort: { fields: [timestamp], order: DESC }) {
			nodes {
				accountId
				accountName
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
					targetInvestmentProgress
					targetPriceProgress
					type
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
					currency
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
					openPnlUsd
				}
			}
		}
	}
`;
