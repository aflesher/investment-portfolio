import React from 'react';
import { Link, graphql } from 'gatsby';
import _ from 'lodash';
import Paginate from 'react-paginate';
import { Typeahead } from 'react-bootstrap-typeahead';
import moment from 'moment';
import numeral from 'numeral';

import { Currency, AssetType } from '../utils/enum';
import Layout from '../components/layout';
import XE from '../components/xe/XE';
import StockHover from '../components/stock-hover/StockHover';
import { IStoreState } from '../store/store';
import { connect } from 'react-redux';
import * as util from '../utils/util';
import { dateInputFormat } from '../utils/util';
import DateRange from '../components/dateRange/DateRange';
import Percent from '../components/percent/percent';
import { IDividend } from '../utils/dividend';
import { IAssessment } from '../utils/assessment';
import { ICompany } from '../utils/company';
import { IPosition } from '../utils/position';
import { IQuote } from '../utils/quote';

interface IDividendsStateProps {
	currency: Currency;
}

interface IDividendsQueryNode
	extends Pick<
		IDividend,
		| 'symbol'
		| 'timestamp'
		| 'amount'
		| 'currency'
		| 'accountId'
		| 'amountUsd'
		| 'amountCad'
	> {
	assessment?: Pick<
		IAssessment,
		'targetInvestmentProgress' | 'targetPriceProgress'
	>;
	company?: Pick<ICompany, 'name' | 'marketCap' | 'prevDayClosePrice' | 'type'>;
	position?: Pick<
		IPosition,
		| 'quantity'
		| 'totalCost'
		| 'totalCostUsd'
		| 'totalCostCad'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
	>;
	quote?: Pick<IQuote, 'price' | 'currency'>;
}

interface IDividendsQueryProps {
	data: {
		allDividend: {
			nodes: IDividendsQueryNode[];
		};
		allPosition: {
			nodes: Pick<
				IPosition,
				'symbol' | 'openPnlCad' | 'openPnlUsd' | 'currency'
			>[];
		};
	};
}

const DIVIDENDS_PER_PAGE = 30;

const mapStateToProps = ({ currency }: IStoreState): IDividendsStateProps => ({
	currency,
});

const DIVIDEND_POSITIONS_YEAR_END: {
	year: number;
	symbol: string;
	amountCad: number;
	amountUsd: number;
	currency: Currency;
}[] = [];

const Dividends: React.FC<IDividendsStateProps & IDividendsQueryProps> = ({
	data,
	currency,
}) => {
	const [startDate, setStartDate] = React.useState(
		moment().startOf('year').toDate()
	);
	const [endDate, setEndDate] = React.useState(new Date());
	const [symbol, setSymbol] = React.useState('');
	const [page, setPage] = React.useState(0);
	const trackedYears = util.getTrackedYears();

	const dividends = _.filter(data.allDividend.nodes, (dividend) => {
		if (startDate && startDate > new Date(dividend.timestamp)) {
			return false;
		}

		if (endDate && endDate < new Date(dividend.timestamp)) {
			return false;
		}

		if (symbol && !dividend.symbol.match(new RegExp(`^${symbol}.*`, 'gi'))) {
			return false;
		}

		return true;
	});

	const dividendPositionsCurrent = data.allPosition.nodes.map(
		({ symbol, openPnlCad, openPnlUsd, currency }) => {
			const previousYearAmount = DIVIDEND_POSITIONS_YEAR_END.find(
				(q) => q.symbol === symbol && q.year === moment().year() - 1
			) || { amountCad: 0, amountUsd: 0 };
			return {
				symbol,
				timestamp: new Date().getTime(),
				amountCad: openPnlCad - previousYearAmount.amountCad,
				amountUsd: openPnlUsd - previousYearAmount.amountUsd,
				currency,
			};
		}
	);

	const dividendPositionsOld = DIVIDEND_POSITIONS_YEAR_END.map(
		({ year, symbol, amountCad, amountUsd, currency }) => ({
			symbol,
			timestamp: moment('12/31/' + year)
				.toDate()
				.getTime(),
			amountCad,
			amountUsd,
			currency,
		})
	);

	const mergedDividendPositions = [
		...dividendPositionsCurrent,
		...dividendPositionsOld,
	];

	const dividendPositions = mergedDividendPositions.filter((dividend) => {
		if (startDate && startDate > new Date(dividend.timestamp)) {
			return false;
		}
		if (
			endDate &&
			endDate <= moment(dividend.timestamp).startOf('day').toDate()
		) {
			return false;
		}

		if (symbol && !dividend.symbol.match(new RegExp(`^${symbol}.*`, 'gi'))) {
			return false;
		}

		return true;
	});

	const totalCad =
		_.sumBy(dividends, (q) => q.amountCad) +
		_.sumBy(dividendPositions, (q) => q.amountCad);
	const totalUsd =
		_.sumBy(dividends, (q) => q.amountUsd) +
		_.sumBy(dividendPositions, (q) => q.amountUsd);

	const symbols = _(data.allDividend.nodes)
		.map((t) => t.symbol)
		.uniq()
		.value();

	const handleSymbolChange = (symbol: string): void => {
		setSymbol(symbol);
		setPage(0);
	};

	const handleStartDateChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		setStartDate(new Date(event.target.value));
		setPage(0);
	};

	const handleEndDateChange = (
		event: React.ChangeEvent<HTMLInputElement>
	): void => {
		setEndDate(new Date(event.target.value));
		setPage(0);
	};

	const handleDateRangeChange = (start: Date, end: Date): void => {
		setStartDate(start);
		setEndDate(end);
		setPage(0);
	};

	const onYearChange = (year: string): void => {
		if (year === '0') {
			return;
		}
		const startDate = moment(year).toDate();
		const endDate = moment(year).endOf('year').toDate();
		setStartDate(startDate);
		setEndDate(endDate);
	};

	const yearTotals = trackedYears.map((year) => ({
		year,
		amount: [...data.allDividend.nodes, ...mergedDividendPositions]
			.filter(({ timestamp }) => moment(timestamp).year() === year)
			.reduce((sum, { amountCad }) => sum + amountCad, 0),
	}));
	const yearTotalsPercent = yearTotals.map(({ year, amount }, index) => ({
		year,
		amount,
		percent: index
			? (yearTotals[index].amount - yearTotals[index - 1].amount) /
			  yearTotals[index - 1].amount
			: 0,
	}));

	return (
		<Layout>
			<div className='p-4'>
				<div className='row mb-4'>
					{yearTotalsPercent.map(({ year, amount, percent }) => (
						<div className='col-2' key={year}>
							<div className='border p-2 mb-2'>
								<div className='link' onClick={() => onYearChange(year + '')}>
									{year}
								</div>
								<div>{numeral(amount).format('$0,0.00')}</div>
								<div>
									<Percent percent={percent} />
								</div>
							</div>
						</div>
					))}
				</div>
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
							<label>Year</label>
							<select
								onChange={(event) => onYearChange(event.target.value)}
								className='form-control'
							>
								{[0, ...trackedYears].map((year) => (
									<option value={year} key={year}>
										{year ? year : '-'}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>
				<div className='row'>
					<div className='col-12'>
						<div className='paginate d-flex justify-content-center'>
							<Paginate
								pageCount={Math.ceil(dividends.length / DIVIDENDS_PER_PAGE)}
								onPageChange={(resp): void => setPage(resp.selected)}
								nextLabel='>'
								previousLabel='<'
								forcePage={page}
								pageRangeDisplayed={6}
								marginPagesDisplayed={3}
							/>
						</div>
					</div>
				</div>
				{dividends.map((dividend, index) => (
					<div
						className='row py-1 border-b'
						key={`${dividend.symbol}${dividend.timestamp}${index}`}
					>
						<div className='col-3'>
							<StockHover
								symbol={dividend.symbol}
								assetCurrency={dividend.currency}
								activeCurrency={currency}
								priceProgress={dividend.assessment?.targetPriceProgress || 0}
								shareProgress={dividend.assessment?.targetInvestmentProgress || 0}
								name={dividend.company?.name || ''}
								marketCap={dividend.company?.marketCap || 0}
								previousClosePrice={dividend.company?.prevDayClosePrice || 0}
								quantity={dividend.position?.quantity || 0}
								costUsd={dividend.position?.totalCostUsd || 0}
								costCad={dividend.position?.totalCostCad || 0}
								valueCad={dividend.position?.currentMarketValueCad || 0}
								valueUsd={dividend.position?.currentMarketValueUsd || 0}
								price={dividend.quote?.price || 0}
								type={dividend?.company?.type || AssetType.stock}
								quoteCurrency={dividend?.quote?.currency || Currency.cad}
							/>
						</div>
						<div className='col-3 text-right'>
							{util.formatDate(dividend.timestamp)}
						</div>
						<div className='col-3 text-right'>
							<XE
								cad={dividend.amountCad}
								usd={dividend.amountUsd}
								currency={dividend.currency}
							/>
						</div>
						<div className='col-3 text-right'>
							<XE
								cad={dividend.amountCad}
								usd={dividend.amountUsd}
								currency={currency}
								hideCurrency={true}
							/>
						</div>
					</div>
				))}
				{dividendPositions.map((dividend, index) => (
					<div
						className='row py-1 border-b'
						key={`${dividend.symbol}${dividend.timestamp}${index}`}
					>
						<div className='col-3'>
							<Link to={`/stock/${dividend.symbol}`} className='link text-uppercase'>
								{dividend.symbol}
							</Link>
						</div>
						<div className='col-3 text-right'>
							{util.formatDate(dividend.timestamp)}
						</div>
						<div className='col-3 text-right'>
							<XE
								cad={dividend.amountCad}
								usd={dividend.amountUsd}
								currency={dividend.currency}
							/>
						</div>
						<div className='col-3 text-right'>
							<XE
								cad={dividend.amountCad}
								usd={dividend.amountUsd}
								currency={currency}
								hideCurrency={true}
							/>
						</div>
					</div>
				))}
				<div className='row mt-2'>
					<div className='col-3 text-right offset-6'>Total</div>
					<div className='col-3 text-right'>
						<XE
							cad={totalCad}
							usd={totalUsd}
							currency={currency}
							hideCurrency={true}
						/>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default connect(mapStateToProps)(Dividends);

export const pageQuery = graphql`
	query {
		allDividend(sort: { fields: timestamp, order: DESC }) {
			nodes {
				amount
				amountCad
				amountUsd
				currency
				symbol
				accountId
				timestamp
				assessment {
					targetInvestmentProgress
					targetPriceProgress
				}
				company {
					name
					marketCap
					prevDayClosePrice
					type
				}
				quote {
					price
					currency
				}
				position {
					quantity
					totalCost
					totalCostUsd
					totalCostCad
					currentMarketValueCad
					currentMarketValueUsd
				}
			}
		}
		allPosition(filter: { symbol: { eq: "hsuv.u.to" } }) {
			nodes {
				openPnlCad
				openPnlUsd
				symbol
				currency
			}
		}
	}
`;
