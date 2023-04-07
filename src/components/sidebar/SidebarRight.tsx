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
import Percent from '../percent/Percent';

interface ISidebarRightStateProps {
	positions: IPositionStateProps[];
	trades: ITradeStateProps[];
	dividends: IDividendStateProps[];
}

interface ISidebarRightDispatchProps {}

enum PositionOrderBy {
	symbol = 1,
	profits = 2,
	quote = 3,
}

const MAX_ACTIVITY = 7;

const SidebarRight: React.FC<
	ISidebarRightStateProps & ISidebarRightDispatchProps
> = ({ positions, trades, dividends }) => {
	const [orderBy, setOrderBy] = React.useState(PositionOrderBy.profits);

	let dividendsAndTrades: (ITradeStateProps | IDividendStateProps)[] = [];
	dividendsAndTrades = _(dividendsAndTrades)
		.concat(trades)
		.concat(dividends)
		.orderBy((q) => q.timestamp, 'desc')
		.slice(0, MAX_ACTIVITY)
		.value();

	const pnl = ({
		quoteCurrency,
		costCad,
		costUsd,
		valueCad,
		valueUsd,
	}: IPositionStateProps) => {
		const amount =
			quoteCurrency === Currency.cad
				? (valueCad - costCad) / costCad
				: (valueUsd - costUsd) / costUsd;

		if (Math.abs(amount) < 0.0001) {
			return 0;
		}

		return amount;
	};

	const quotePercentage = ({
		price,
		previousClosePrice,
	}: IPositionStateProps) => {
		return (price - previousClosePrice) / price;
	};

	return (
		<div>
			<div className='positions'>
				<h4>Portfolio</h4>
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
						onClick={(): void => setOrderBy(PositionOrderBy.quote)}
					>
						Q
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
								case PositionOrderBy.quote:
									return quotePercentage(position);
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
								})}
							>
								<Percent percent={pnl(position)} hidePlus={true} />
							</div>
							<div className='col-4 text-right'>
								<Percent percent={quotePercentage(position)} />
							</div>
						</div>
					))
					.value()}
			</div>

			<div className='pt-2'>
				<h4>Recent Activity</h4>
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
