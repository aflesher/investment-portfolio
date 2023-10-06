import React, { useState, useContext } from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import numeral from 'numeral';
import classNames from 'classnames';
import { connect } from 'react-redux';
import moment from 'moment-timezone';

import { IStoreState } from '../store/store';
import { AssetType } from '../utils/enum';
import Layout from '../components/layout';
import CompanyBanner from '../components/company-banner/CompanyBanner';
import XE from '../components/xe/XE';
import Order from '../components/order/Order';
import Assessment from '../components/assessment/Assessment';
import Trade from '../components/trade/Trade';
import {
	formatDate,
	marketCap,
	assetLink,
	coinsPerShare,
	cryptoPremium,
	getMaxShares,
	getTimeHeld,
} from '../utils/util';
import { IStockSplit } from '../../declarations/stock-split';
import StockSplits from '../components/stock-splits/StockSplits';
import { ICompany } from '../../declarations/company';
import { IPosition } from '../../declarations/position';
import { IQuote } from '../../declarations/quote';
import { ITrade } from '../../declarations/trade';
import { IAssessment } from '../../declarations/assessment';
import { IDividend } from '../../declarations/dividend';
import { IOrder } from '../../declarations/order';
import { IEarningsDate } from '../../declarations/earnings-date';
import FirebaseImage from '../components/firebase-image/FirebaseImage';
import { CurrencyContext } from '../context/currency.context';

interface IStockTemplateStateProps extends Pick<IStoreState, 'storage'> {}

const estimatedManaLandValue = 5000;

interface IStockTemplateNode
	extends Pick<
		ICompany,
		| 'name'
		| 'marketCap'
		| 'prevDayClosePrice'
		| 'symbol'
		| 'yield'
		| 'highPrice52'
		| 'lowPrice52'
		| 'type'
	> {
	position?: Pick<
		IPosition,
		| 'quantity'
		| 'totalCost'
		| 'totalCostCad'
		| 'totalCostUsd'
		| 'averageEntryPrice'
		| 'openPnl'
		| 'openPnlCad'
		| 'openPnlUsd'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
	>;
	quote: Pick<IQuote, 'price' | 'priceUsd' | 'priceCad' | 'currency'>;
	trades: Pick<
		ITrade,
		| 'quantity'
		| 'price'
		| 'action'
		| 'timestamp'
		| 'pnlCad'
		| 'pnlUsd'
		| 'isOpeningPositionTrade'
		| 'priceCad'
		| 'priceUsd'
		| 'isSell'
		| 'accountName'
		| 'type'
	>[];
	assessment?: Pick<
		IAssessment,
		| 'minuses'
		| 'pluses'
		| 'targetPrice'
		| 'targetInvestment'
		| 'notes'
		| 'lastUpdatedTimestamp'
		| 'questions'
		| 'valuations'
		| 'rating'
	>;
	dividends: Pick<
		IDividend,
		'amount' | 'timestamp' | 'amountCad' | 'amountUsd'
	>[];
	orders: Pick<
		IOrder,
		| 'limitPrice'
		| 'limitPriceCad'
		| 'limitPriceUsd'
		| 'openQuantity'
		| 'action'
		| 'accountName'
	>[];
}

interface IStockTemplateQuery {
	data: {
		allCompany: {
			nodes: IStockTemplateNode[];
		};
		allQuote: {
			nodes: Pick<IQuote, 'symbol' | 'price' | 'priceCad' | 'priceUsd'>[];
		};
		allStockSplit: {
			nodes: IStockSplit[];
		};
		allEarningsDate: {
			nodes: Pick<IEarningsDate, 'timestamp'>[];
		};
	};
}

const mapStateToProps = ({
	storage,
}: IStoreState): IStockTemplateStateProps => ({
	storage,
});

const StockTemplate: React.FC<IStoreState & IStockTemplateQuery> = ({
	data,
	storage,
}) => {
	const [toggleIncomeStatement, setToggleIncomeStatement] = useState(false);
	const currency = useContext(CurrencyContext);
	const company = data.allCompany.nodes[0];
	const cryptoQuotes = data.allQuote.nodes;
	const btcQuote = _.find(cryptoQuotes, (q) => q.symbol === 'btc');
	const ethQuote = _.find(cryptoQuotes, (q) => q.symbol === 'eth');
	const { quote, assessment, trades, dividends } = company;
	const position = company.position || {
		symbol: company.symbol,
		quantity: 0,
		cost: 0,
		value: 0,
		openPnl: 0,
		openPnlCad: 0,
		openPnlUsd: 0,
		totalCost: 0,
		totalCostCad: 0,
		totalCostUsd: 0,
		currentMarketValueUsd: 0,
		currentMarketValueCad: 0,
		averageEntryPrice: 0,
		positions: [],
	};

	const pAndLClosedCad = _.sumBy(trades, (trade) => trade.pnlCad || 0);
	const pAndLClosedUsd = _.sumBy(trades, (trade) => trade.pnlUsd || 0);
	const dividendsTotalCad = _.sumBy(dividends, (d) => d.amountCad);
	const dividendsTotalUsd = _.sumBy(dividends, (d) => d.amountUsd);
	const totalCad = position.openPnlCad + pAndLClosedCad + dividendsTotalCad;
	const totalUsd = position.openPnlUsd + pAndLClosedUsd + dividendsTotalUsd;
	const openingTrade = _.find(trades, (t) => t.isOpeningPositionTrade);
	const openingSharePrice = openingTrade?.price || 0;
	const openingToAverageSharePrice =
		(position.averageEntryPrice - openingSharePrice) / openingSharePrice;
	const coins = coinsPerShare(company.symbol);
	const premium = cryptoPremium(
		{ symbol: company.symbol, priceCad: quote.priceCad },
		btcQuote?.priceCad || 0,
		ethQuote?.priceCad || 0
	);
	const stockSplits = data.allStockSplit.nodes;

	const lastBuy = _.maxBy(
		_.filter(trades, (trade) => trade.action === 'buy'),
		(trade) => trade.timestamp
	);
	const accumulatedDividends = _.filter(
		dividends,
		(d) => d.timestamp > (lastBuy?.timestamp || 100000000)
	);
	const accumulatedDividendsCad = _.sumBy(
		accumulatedDividends,
		(d) => d.amountCad
	);
	const accumulatedDividendsUsd = _.sumBy(
		accumulatedDividends,
		(d) => d.amountUsd
	);

	const potentialAth = (company.highPrice52 - quote.price) * position.quantity;
	const cadToUsd = quote.priceCad / quote.priceUsd;
	const usdToCad = cadToUsd / 1.0;
	const potentialAthUsd =
		quote.currency === 'usd' ? potentialAth : potentialAth * cadToUsd;
	const potentialAthCad =
		quote.currency === 'cad' ? potentialAth : potentialAth * usdToCad;
	const timeHeld = getTimeHeld(trades);

	const tradeAccountsMap: { [accountName: string]: number } = {};
	trades.forEach(({ accountName, action, quantity }) => {
		const currentQuantity = tradeAccountsMap[accountName] || 0;
		tradeAccountsMap[accountName] =
			currentQuantity + (action === 'buy' ? 1 : -1) * quantity;
	});

	const positionFormat = company.type === 'crypto' ? '0,0.0000' : '0,0';
	const earningsDate = data.allEarningsDate.nodes[0]?.timestamp || 0;
	const incomeStatements =
		assessment?.notes
			.filter((q) => q.match(/image=\S+income-statement\S+/))
			.map((q) => q.match(/image=(\S+income-statement\S+)/)?.[1] || '') || [];

	return (
		<Layout>
			{toggleIncomeStatement && (
				<div className='income-statements mx-auto'>
					<div>
						<span className='link' onClick={() => setToggleIncomeStatement(false)}>
							BACK
						</span>
					</div>
					<div>
						{incomeStatements.reverse().map((q) => (
							<FirebaseImage key={q} image={q} storage={storage} />
						))}
					</div>
				</div>
			)}
			{!toggleIncomeStatement && (
				<div className='p-4'>
					<CompanyBanner name={company.name} symbol={company.symbol} />

					<div className='row mt-4'>
						<div className='col-6'>
							<h3 className='mt-4'>Information</h3>
							<div className='row font-weight-bold'>
								<div className='col-6'>Price</div>
								<div className='col-6'>{numeral(quote.price).format('$0,0.00')}</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>52 Week High</div>
								<div className='col-6'>
									{numeral(company.highPrice52).format('$0,0.00')}&nbsp; (
									{numeral((company.highPrice52 - quote.price) / quote.price).format(
										'0.00%'
									)}
									)
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>52 Week Low</div>
								<div className='col-6'>
									{numeral(company.lowPrice52).format('$0,0.00')}&nbsp; (
									{numeral((company.lowPrice52 - quote.price) / quote.price).format(
										'0.00%'
									)}
									)
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Market Cap</div>
								<div className='col-6 text-uppercase'>
									{marketCap(company.marketCap)}
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Yield</div>
								<div className='col-6'>
									{numeral((company.yield || 0) / 100).format('%0.00')}
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>
									<a
										href={assetLink(company.symbol, company.name, company.type)}
										target='_blank'
										rel='noreferrer'
									>
										{company.type === AssetType.stock ? 'Yahoo Finance' : 'CoinMarketCap'}
									</a>
								</div>
							</div>
							{!!earningsDate && (
								<div className='row font-weight-bold'>
									<div className='col-6'>Earnings</div>
									<div className='col-6'>
										{moment(earningsDate)
											.startOf('day')
											.diff(moment().startOf('day'), 'days')}{' '}
										days away
									</div>
								</div>
							)}
							{!!incomeStatements?.length && (
								<div className='row font-weight-bold'>
									<div className='col-6'>Income Statements</div>
									<div className='col-6'>
										<span
											className='link'
											onClick={() => setToggleIncomeStatement(!toggleIncomeStatement)}
										>
											{incomeStatements.length}
										</span>
									</div>
								</div>
							)}
						</div>

						<div className='col-6'>
							<h3 className='mt-4'>Position</h3>
							<div className='row font-weight-bold'>
								<div className='col-6'>Avg Share Price</div>
								<div className='col-6 text-uppercase'>
									{numeral(position?.averageEntryPrice).format('$0,0.00')}
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Opening Trade Price</div>
								<div className='col-6 text-uppercase'>
									{openingSharePrice
										? numeral(openingSharePrice).format('$0,0.00')
										: 'n/a'}
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Opening Trade to Avg</div>
								<div className='col-6 text-uppercase'>
									{openingToAverageSharePrice
										? numeral(openingToAverageSharePrice).format('0.00%')
										: 'n/a'}
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>
									{company.type === 'crypto' ? 'Coins' : 'Shares'}
								</div>
								<div className='col-6'>
									{numeral(position?.quantity).format(positionFormat)}
								</div>
							</div>
							{!!coins && (
								<React.Fragment>
									<div className='row font-weight-bold'>
										<div className='col-6'>Coins</div>
										<div className='col-6'>
											{numeral(position?.quantity * coins).format('0,0.0000')}
										</div>
									</div>
									<div className='row font-weight-bold'>
										<div className='col-6'>Premium</div>
										<div className='col-6'>{numeral(premium).format('0.00%')}</div>
									</div>
								</React.Fragment>
							)}
							<div className='row font-weight-bold'>
								<div className='col-6'>Open P & L %</div>
								<div
									className={classNames({
										'col-6': true,
										'text-positive': (position?.openPnl || 0) >= 0,
										'text-negative': (position?.openPnl || 0) < 0,
									})}
								>
									{numeral(position.openPnl / position.totalCost).format('0,0.00%')}
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Open P & L $</div>
								<div
									className={classNames({
										'col-6': true,
										'text-positive': position.openPnl >= 0,
										'text-negative': position.openPnl < 0,
									})}
								>
									<XE
										cad={position.openPnlCad}
										usd={position.openPnlUsd}
										currency={currency}
									/>
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Closed P & L $</div>
								<div
									className={classNames({
										'col-6': true,
										'text-positive': pAndLClosedCad >= 0,
										'text-negative': pAndLClosedCad < 0,
									})}
								>
									<XE cad={pAndLClosedCad} usd={pAndLClosedUsd} currency={currency} />
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Dividends</div>
								<div
									className={classNames({
										'col-6': true,
										'text-positive': dividends.length,
									})}
								>
									<XE
										cad={dividendsTotalCad}
										usd={dividendsTotalUsd}
										currency={currency}
									/>
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Totals</div>
								<div
									className={classNames({
										'col-6': true,
										'text-positive': totalCad >= 0,
										'text-negative': totalCad < 0,
									})}
								>
									<XE cad={totalCad} usd={totalUsd} currency={currency} />
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Value</div>
								<div
									className={classNames({
										'col-6': true,
									})}
								>
									<XE
										cad={position.currentMarketValueCad}
										usd={position.currentMarketValueUsd}
										currency={currency}
									/>
								</div>
							</div>
							{!!accumulatedDividendsCad && (
								<div className='row font-weight-bold font-italic'>
									<div className='col-6'>*unspent dividends</div>
									<div className='col-6'>
										<XE
											cad={accumulatedDividendsCad}
											usd={accumulatedDividendsUsd}
											currency={currency}
										/>
										<div>
											({Math.floor(accumulatedDividendsCad / quote.priceCad)} shares)
										</div>
									</div>
								</div>
							)}
							{company.symbol === 'mana' && (
								<div className='row font-weight-bold font-italic'>
									<div className='col-6'>LAND</div>
									<div className='col-6'>
										<XE
											cad={estimatedManaLandValue * quote.priceCad}
											usd={estimatedManaLandValue * quote.priceUsd}
											currency={currency}
										/>
									</div>
								</div>
							)}
							<div className='row'>
								<div className='col-6'>Potential to 52WH</div>
								<div
									className={classNames({
										'col-6': true,
									})}
								>
									+<XE cad={potentialAthCad} usd={potentialAthUsd} currency={currency} />
								</div>
							</div>
							{Boolean(openingTrade) && (
								<div className='row'>
									<div className='col-6'>Time held</div>
									<div
										className={classNames({
											'col-6': true,
										})}
									>
										Y:{Math.floor(timeHeld / 31557600000)} M:
										{Math.floor((timeHeld % 31557600000) / 2629800000)}
									</div>
								</div>
							)}
							<div className='row'>
								<div className='col-6'>Accounts</div>
								<div className='col-6'>
									{Object.entries(tradeAccountsMap)
										.filter((q) => q[1] > 0)
										.map(
											([accountName, quantity]) =>
												`${accountName}:${numeral(quantity).format(positionFormat)}`
										)
										.join(' / ')}
								</div>
							</div>
						</div>
					</div>

					<h3>Orders</h3>
					{!!company.orders.length
						? company.orders.map((order, index) => (
								<div key={index} className='mb-4'>
									<Order
										symbol={company.symbol}
										action={order.action}
										openQuantity={order.openQuantity || 0}
										positionQuantity={position?.quantity || 0}
										limitPriceCad={order.limitPriceCad || 0}
										limitPriceUsd={order.limitPriceUsd || 0}
										limitPrice={order.limitPrice}
										accountName={order.accountName}
										quotePrice={quote.price}
										positionCost={position?.totalCost || 0}
										currency={currency}
									/>
								</div>
						  ))
						: '(no orders)'}

					<h3>Assessment</h3>
					<div>
						{!!assessment ? (
							<Assessment
								symbol={company.symbol}
								targetPrice={assessment.targetPrice}
								lastUpdatedTimestamp={assessment.lastUpdatedTimestamp}
								quotePrice={quote.price}
								pluses={assessment.pluses}
								minuses={assessment.minuses}
								notes={assessment.notes}
								questions={assessment.questions}
								positionTotalCost={position?.totalCost || 0}
								targetInvestment={assessment.targetInvestment}
								valuations={assessment.valuations}
								rating={assessment.rating}
								name={''}
								maxShares={getMaxShares(trades)}
								currentShares={position.quantity}
								storage={storage}
							/>
						) : (
							<span>(no assessment)</span>
						)}
					</div>
					{!!stockSplits.length && (
						<div className='mb-4'>
							<h3>Stock Splits</h3>
							<StockSplits stockSplits={stockSplits} />
						</div>
					)}
					<div className='row'>
						<div className='col-7'>
							<h3>Trades</h3>
							<div>
								{trades.length
									? _.orderBy(trades, (t) => t.timestamp, 'desc').map((trade, i) => (
											<Trade
												symbol={company.symbol}
												isSell={trade.action == 'sell'}
												quantity={trade.quantity}
												key={i}
												timestamp={trade.timestamp}
												currency={quote.currency}
												tradePrice={trade.price}
												pnlCad={trade.pnlCad}
												pnlUsd={trade.pnlUsd}
												accountName={trade.accountName}
												type={trade.type}
											/>
									  ))
									: '(no trades)'}
							</div>
						</div>
						<div className='col-5'>
							<h3>Dividends</h3>
							<div>
								{dividends.length
									? _.orderBy(dividends, (t) => t.timestamp, 'desc').map(
											(dividend, i) => (
												<div key={i} className='row border-top-normal'>
													<div className='col-6'>{formatDate(dividend.timestamp)}</div>
													<div className='col-6'>
														<XE
															cad={dividend.amountCad}
															usd={dividend.amountUsd}
															currency={currency}
														/>
													</div>
												</div>
											)
									  )
									: '(no dividends)'}
							</div>
						</div>
					</div>
				</div>
			)}
		</Layout>
	);
};

export default connect(mapStateToProps, null)(StockTemplate);

export const pageQuery = graphql`
	query($symbol: String!) {
		allCompany(filter: { symbol: { eq: $symbol } }) {
			nodes {
				name
				marketCap
				prevDayClosePrice
				symbol
				yield
				highPrice52
				lowPrice52
				type
				position {
					quantity
					totalCost
					totalCostUsd
					totalCostCad
					averageEntryPrice
					openPnl
					openPnlCad
					openPnlUsd
					currentMarketValueCad
					currentMarketValueUsd
				}
				quote {
					price
					priceUsd
					priceCad
					currency
				}
				trades {
					quantity
					price
					action
					symbol
					timestamp
					pnlCad
					pnlUsd
					isOpeningPositionTrade
					priceUsd
					priceCad
					isSell
					accountName
					type
				}
				assessment {
					symbol
					minuses
					pluses
					targetPrice
					targetShares
					targetInvestment
					notes
					lastUpdatedTimestamp
					assessment
					questions
					valuations
					rating
				}
				dividends {
					amount
					timestamp
					amountUsd
					amountCad
				}
				orders {
					symbol
					limitPrice
					limitPriceCad
					limitPriceUsd
					openQuantity
					action
					accountName
				}
			}
		}
		allQuote(filter: { type: { eq: "crypto" } }) {
			nodes {
				symbol
				price
				priceCad
				priceUsd
			}
		}
		allStockSplit(filter: { symbol: { eq: $symbol } }) {
			nodes {
				ratio
				symbol
				date
				isReverse
				isApplied
			}
		}
		allEarningsDate(filter: { symbol: { eq: $symbol } }) {
			nodes {
				timestamp
			}
		}
	}
`;
