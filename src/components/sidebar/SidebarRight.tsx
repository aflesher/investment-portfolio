import React from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import { Link } from 'gatsby';
import numeral from 'numeral';

import { IPositionStateProps } from '../position/Position';
import Trade, { ITradeStateProps } from '../trade/Trade';
import Dividend, { IDividendStateProps } from '../dividend/Dividend';
import { Currency } from '../../utils/enum';
import StockHover from '../stock-hover/StockHover';

interface ISidebarRightStateProps {
	positions: IPositionStateProps[];
	trades: ITradeStateProps[];
	dividends: IDividendStateProps[];
}

interface ISidebarRightDispatchProps {}

enum PositionOrderBy {
	symbol = 1,
	profits = 2,
	position = 3,
}

const SidebarRight: React.FC<
	ISidebarRightStateProps & ISidebarRightDispatchProps
> = ({ positions, trades, dividends }) => {
	const [orderBy, setOrderBy] = React.useState(PositionOrderBy.profits);
	const portfolioTotalValue = _.sumBy(positions, (p) => p.valueCad);
	const portfolioTotalCost = _.sumBy(positions, (p) => p.costCad);
	const inTheBlack = portfolioTotalValue > portfolioTotalCost;

	let dividendsAndTrades: (ITradeStateProps | IDividendStateProps)[] = [];
	dividendsAndTrades = _(dividendsAndTrades)
		.concat(trades)
		.concat(dividends)
		.orderBy((q) => q.timestamp, 'desc')
		.slice(0, 5)
		.value();

	const pnl = ({
		quoteCurrency,
		costCad,
		costUsd,
		valueCad,
		valueUsd,
	}: IPositionStateProps) => {
		return quoteCurrency === Currency.cad
			? (valueCad - costCad) / costCad
			: (valueUsd - costUsd) / costUsd;
	};

	return (
		<div>
			<div className='positions'>
				<h3>Portfolio</h3>
				<div className='row'>
					<div
						className='col-4 link'
						onClick={(): void => setOrderBy(PositionOrderBy.symbol)}
					>
						SYMBOL
					</div>
					<div
						className='col-4 text-right link'
						onClick={(): void => setOrderBy(PositionOrderBy.profits)}
					>
						P&L
					</div>
					<div
						className='col-4 text-right link'
						onClick={(): void => setOrderBy(PositionOrderBy.position)}
					>
						%oP
					</div>
				</div>
				{_(positions)
					.orderBy(
						(position) => {
							switch (orderBy) {
								case PositionOrderBy.symbol:
									return position.symbol;
								case PositionOrderBy.profits:
									return position.quoteCurrency === Currency.cad
										? (position.valueCad - position.costCad) / position.costCad
										: (position.valueUsd - position.costUsd) / position.costUsd;
								case PositionOrderBy.position:
									return position.valueCad / portfolioTotalValue;
							}
						},
						orderBy == PositionOrderBy.symbol ? 'asc' : 'desc'
					)
					.map((position) => (
						<div className='row position' key={position.symbol}>
							<div className='col-4 pr-0'>
								<div className='d-inline-block'>
									<StockHover {...position} />
								</div>
							</div>
							<div
								className={classNames({
									'text-rtl': pnl(position) >= 0,
									'col-4': true,
									'text-right': true,
									'text-positive': pnl(position) >= 0,
									'text-negative': pnl(position) < 0,
								})}
							>
								{numeral(pnl(position)).format('0,0.00%')}
							</div>
							<div className='col-4 text-right'>
								{numeral(position.percentageOfPortfolio).format('0.0%')}
							</div>
						</div>
					))
					.value()}
			</div>

			<div className='pt-2'>
				<h3>Recent Trades</h3>
				<div></div>
				<div>
					<div className='d-flex py-1 justify-content-between'>
						<div className='text-left'>
							<Link to='/dividends'>View All Dividends</Link>
						</div>
						<div className='text-right'>
							<Link to='/trades'>View All Trades</Link>
						</div>
					</div>
					<div style={{ fontSize: '80%' }}>
						{dividendsAndTrades.map((dividendOrTrade, index) =>
							'tradePrice' in dividendOrTrade ? (
								<Trade
									key={`${dividendOrTrade.symbol}${dividendOrTrade.timestamp}${index}`}
									{...dividendOrTrade}
								/>
							) : (
								<Dividend
									key={`${dividendOrTrade.symbol}${dividendOrTrade.timestamp}${index}`}
									{...dividendOrTrade}
								/>
							)
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SidebarRight;
