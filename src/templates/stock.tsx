import React from 'react';
import { graphql } from 'gatsby';
import _ from 'lodash';
import numeral from 'numeral';
import classNames from 'classnames';
import { connect } from 'react-redux';

import { IStoreState } from '../store/store';
import { Currency, AssetType } from '../utils/enum';
import Layout from '../components/layout';
import CompanyBanner from '../components/company-banner/CompanyBanner';
import XE from '../components/xe/XE';
import Order from '../components/order/Order';
import Assessment from '../components/assessment/Assessment';
import Trade from '../components/trade/Trade';
import { formatDate, marketCap, assetLink, coinsPerShare, cryptoPermium } from '../utils/util';

interface IStockTemplateStateProps {
	currency: Currency
}

interface IStockTemplateQuery {
	data: {
		allCompany: {
			nodes: {
				name: string,
				marketCap: number,
				prevDayClosePrice: number,
				symbol: string,
				yield?: number,
				highPrice52: number,
				lowPrice52: number,
				type: AssetType,
				position?: {
					quantity: number,
					totalCost: number,
					totalCostUsd: number,
					totalCostCad: number,
					averageEntryPrice: number,
					openPnl: number,
					openPnlCad: number,
					openPnlUsd: number,
					currentMarketValueCad: number,
					currentMarketValueUsd: number,
					positions: {
						symbol: string,
						totalCost: number,
						totalCostUsd: number,
						totalCostCad: number,
						currentMarketValueCad: number,
						currentMarketValueUsd: number,
						quantity: number
					}[]
				}
				quote: {
					price: number,
					priceUsd: number,
					priceCad: number,
					currency: Currency
				}
				trades: {
					quantity: number,
					price: number,
					action: string,
					timestamp: number,
					pnlCad: number,
					pnlUsd: number,
					isOpeningPositionTrade: boolean
				}[]
				assessment?: {
					minuses: string[],
					pluses: string[],
					targetPrice: number,
					targetInvestment: number,
					notes: string[],
					lastUpdatedTimestamp: number,
					questions: string[],
					valuations: string[],
				}
				dividends: {
					amount: number,
					timestamp: number,
					amountUsd: number,
					amountCad: number,
				}[]
				orders: {
					limitPrice: number,
					limitPriceCad: number,
					limitPriceUsd: number,
					openQuantity: number,
					action: string,
					accountName: string,
				}[]
			}[]
		}
		allQuote: {
			nodes: {
				symbol: string,
				price: number,
				priceCad: number,
				priceUsd: number,
			}[]
		}
	}
}

const mapStateToProps = ({currency}: IStoreState): IStockTemplateStateProps => ({
	currency
});

const StockTemplate: React.FC<IStoreState & IStockTemplateQuery> = ({ data, currency }) => {
	const company = data.allCompany.nodes[0];
	const cryptoQuotes = data.allQuote.nodes;
	const btcQuote = _.find(cryptoQuotes, q => q.symbol === 'btc');
	const ethQuote = _.find(cryptoQuotes, q => q.symbol === 'eth');
	const { quote, assessment, trades, dividends } = company;
	const position = company.position ||
	{
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
		positions: []
	};

	const pAndLClosedCad = _.sumBy(trades, trade => trade.pnlCad || 0);
	const pAndLClosedUsd = _.sumBy(trades, trade => trade.pnlUsd || 0);
	const dividendsTotalCad = _.sumBy(dividends, d => d.amountCad);
	const dividendsTotalUsd = _.sumBy(dividends, d => d.amountUsd);
	const totalCad = position.openPnlCad + pAndLClosedCad + dividendsTotalCad;
	const totalUsd = position.openPnlUsd + pAndLClosedUsd + dividendsTotalUsd;
	const openingTrade = _.find(trades, t => t.isOpeningPositionTrade);
	const openingSharePrice = openingTrade?.price || 0;
	const openingToAverageSharePrice = (position.averageEntryPrice - openingSharePrice) / openingSharePrice;
	const coins = coinsPerShare(company.symbol);
	const premium = cryptoPermium(
		{symbol: company.symbol, priceCad: quote.priceCad},
		btcQuote?.priceCad || 0,
		ethQuote?.priceCad || 0
	);

	const lastBuy = _.maxBy(_.filter(trades, trade => trade.action === 'buy'), trade => trade.timestamp);
	const acumlatedDividends = _.filter(dividends, d => d.timestamp > (lastBuy?.timestamp || 100000000));
	const acumlatedDividendsCad = _.sumBy(acumlatedDividends, d => d.amountCad);
	const acumlatedDividendsUsd = _.sumBy(acumlatedDividends, d => d.amountUsd);


	return (
		<Layout>
			<div className='p-4'>
				<CompanyBanner
					name={company.name}
					symbol={company.symbol}
				/>

				<div className='row mt-4'>
					
					<div className='col-6'>
						<h3 className="mt-4">
							Information
						</h3>
						<div className='row font-weight-bold'>
							<div className='col-6'>Price</div>
							<div className='col-6'>{numeral(quote.price).format('$0,0.00')}</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>52 Week High</div>
							<div className='col-6'>
								{numeral(company.highPrice52).format('$0,0.00')}&nbsp;
								({numeral((company.highPrice52 - quote.price) / quote.price).format('0.00%')})
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>52 Week Low</div>
							<div className='col-6'>
								{numeral(company.lowPrice52).format('$0,0.00')}&nbsp;
								({numeral((company.lowPrice52 - quote.price) / quote.price).format('0.00%')})
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
					</div>

					<div className='col-6'>
						<h3 className="mt-4">
							Position
						</h3>
						<div className='row font-weight-bold'>
							<div className='col-6'>Avg Share Price</div>
							<div className='col-6 text-uppercase'>
								{numeral(position?.averageEntryPrice).format('$0,0.00')}
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>Opening Trade Price</div>
							<div className='col-6 text-uppercase'>
								{openingSharePrice ?
									numeral(openingSharePrice).format('$0,0.00') :
									'n/a'}
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>Opening Trade to Avg</div>
							<div className='col-6 text-uppercase'>
								{openingToAverageSharePrice ?
									numeral(openingToAverageSharePrice).format('0.00%') :
									'n/a'}
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>{company.type === 'crypto' ? 'Coins' : 'Shares'}</div>
							<div className='col-6'>
								{numeral(position?.quantity).format(company.type === 'crypto' ? '0,0.0000' : '0,0')}
							</div>
						</div>
						{!!coins &&
						<React.Fragment>
							<div className='row font-weight-bold'>
								<div className='col-6'>Coins</div>
								<div className='col-6'>
									{numeral(position?.quantity * coins).format('0,0.0000')}
								</div>
							</div>
							<div className='row font-weight-bold'>
								<div className='col-6'>Premium</div>
								<div className='col-6'>
									{numeral(premium).format('0.00%')}
								</div>
							</div>
						</React.Fragment>
						}
						{!!position?.positions.length &&
						<div className='row font-weight-bold'>
							<div className='col-6'>
								Combined Coins
							</div>
							<div className={classNames({
								'col-6': true
							})}>
								{position.quantity +
										_.sumBy(position.positions, p => p.quantity * coinsPerShare(p.symbol))}
							</div>
						</div>
						}
						<div className='row font-weight-bold'>
							<div className='col-6'>Open P & L %</div>
							<div className={classNames({
								'col-6': true,
								'text-positive': (position?.openPnl || 0) >= 0,
								'text-negative': (position?.openPnl || 0) < 0
							})}>
								{numeral(position.openPnl / position.totalCost)
									.format('0,0.00%')}
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>
								Open P & L $
							</div>
							<div className={classNames({
								'col-6': true,
								'text-positive': position.openPnl >= 0,
								'text-negative': position.openPnl < 0
							})}>
								<XE
									cad={position.openPnlCad}
									usd={position.openPnlUsd}
									currency={currency}
								/>
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>
								Closed P & L $
							</div>
							<div className={classNames({
								'col-6': true,
								'text-positive': pAndLClosedCad >= 0,
								'text-negative': pAndLClosedCad < 0
							})}>
								<XE
									cad={pAndLClosedCad}
									usd={pAndLClosedUsd}
									currency={currency}
								/>
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>
								Dividends
							</div>
							<div className={classNames({
								'col-6': true,
								'text-positive': dividends.length
							})}>
								<XE
									cad={dividendsTotalCad}
									usd={dividendsTotalUsd}
									currency={currency}
								/>
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>
								Totals
							</div>
							<div className={classNames({
								'col-6': true,
								'text-positive': totalCad >= 0,
								'text-negative': totalCad < 0
							})}>
								<XE
									cad={totalCad}
									usd={totalUsd}
									currency={currency}
								/>
							</div>
						</div>
						<div className='row font-weight-bold'>
							<div className='col-6'>
								Value
							</div>
							<div className={classNames({
								'col-6': true
							})}>
								<XE
									cad={position.currentMarketValueCad}
									usd={position.currentMarketValueUsd}
									currency={currency}
								/>
							</div>
						</div>
						{!!position?.positions.length &&
						<div className='row font-weight-bold'>
							<div className='col-6'>
								Combined Value
							</div>
							<div className={classNames({
								'col-6': true
							})}>
								<XE
									cad={
										position.currentMarketValueCad +
										_.sumBy(position.positions, p => p.currentMarketValueCad)
									}
									usd={
										position.currentMarketValueUsd 
										+ _.sumBy(position.positions, p => p.currentMarketValueUsd)
									}
									currency={currency}
								/>
							</div>
						</div>
						}
						{!!acumlatedDividendsCad &&
						<div className='row font-weight-bold font-italic'>
							<div className='col-6'>
								*unspent dividends
							</div>
							<div className='col-6'>
								<XE
									cad={acumlatedDividendsCad}
									usd={acumlatedDividendsUsd}
									currency={currency}
								/>
								<div>({ Math.floor(acumlatedDividendsCad / quote.priceCad) } shares)</div>
							</div>
						</div>
						}
					</div>

				</div>

				<h3>Orders</h3>
				{!!company.orders.length ? company.orders.map((order, index) =>
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
				) : '(no orders)'}
				
				<h3>
					Assessment
				</h3>
				<div>
					{!!assessment ?
						<Assessment
							symbol={company.symbol}
							targetPrice={assessment.targetPrice}
							lastUpdatedTimestamp={assessment.lastUpdatedTimestamp}
							quotePrice={quote.price}
							pluses={assessment.pluses}
							minuses={assessment.minuses}
							notes={assessment.notes}
							questions={assessment.questions}
							positionTotalCost={(position?.totalCost || 0) + _.sumBy(position?.positions, p => p.totalCostCad)}
							targetInvestment={assessment.targetInvestment}
							valuations={assessment.valuations}
							name={''}
						/> :
						<span>(no assessment)</span>
					}
				</div>
				<div className='row'>
					<div className='col-6'>
						<h3>
							Trades
						</h3>
						<div>
							{trades.length ? _(trades).orderBy(t => t.timestamp, 'desc').map((trade, i) => 
								<Trade
									symbol={company.symbol}
									isSell={trade.action == 'sell'}
									quantity={trade.quantity}
									key={i}
									timestamp={trade.timestamp}
									price={quote.price}
									previousClosePrice={company.prevDayClosePrice}
									name={company.name}
									currency={quote.currency}
									marketCap={company.marketCap || 0}
									shareProgress={position.totalCost / (assessment?.targetInvestment || 0)}
									priceProgress={quote.price / (assessment?.targetPrice || 0)}
									activeCurrency={currency}
									assetCurrency={quote.currency}
									tradePrice={trade.price}
									pnlCad={trade.pnlCad}
									pnlUsd={trade.pnlUsd}
									costCad={position.totalCostCad}
									costUsd={position.totalCostUsd}
									valueCad={position.currentMarketValueCad}
									valueUsd={position.currentMarketValueUsd}
									type={company.type}
									quoteCurrency={quote.currency}
								/>
							).value() : '(no trades)'}
						</div>
					</div>
					<div className='col-6'>
						<h3>
							Dividends
						</h3>
						<div>
							{dividends.length ? _(dividends).orderBy(t => t.timestamp, 'desc').map((dividend, i) => 
								<div key={i} className='row border-top-normal'>
									<div className='col-6'>
										{formatDate(dividend.timestamp)}
									</div>
									<div className='col-6'>
										<XE
											cad={dividend.amountCad}
											usd={dividend.amountUsd}
											currency={currency}
										/>
									</div>
								</div>
							).value() : '(no dividends)'}
						</div>
					</div>
				</div>
				
				
			</div>
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
					positions {
						symbol
						totalCost
						totalCostUsd
						totalCostCad
						currentMarketValue
						currentMarketValueCad
						quantity
						currentMarketValueUsd
					}
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
		allQuote(filter: {type: {eq: "crypto"}}) {
			nodes {
				symbol
				price
				priceCad
				priceUsd
			}
		}
	}
	`;
