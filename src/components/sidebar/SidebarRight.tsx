import React from 'react';
import _ from 'lodash';
import { Link } from 'gatsby';

import Trade, { ITradeStateProps } from '../trade/Trade';
import Dividend, { IDividendStateProps } from '../dividend/Dividend';
import { Currency } from '../../utils/enum';
import AssetSymbol from '../stock-hover/AssetSymbol';
import Percent from '../percent/Percent';
import { IPosition } from '../../../declarations/position';
import ColoredNumbers from '../colored-numbers/ColoredNumbers';

export interface ISidebarPosition
	extends Pick<
		IPosition,
		| 'symbol'
		| 'currency'
		| 'currentMarketValueCad'
		| 'currentMarketValueUsd'
		| 'totalCostCad'
		| 'totalCostUsd'
		| 'averageEntryPrice'
	> {
	quotePrice: number;
	previousClosePrice: number;
}

interface ISidebarRightStateProps {
	positions: ISidebarPosition[];
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

	const dividendsAndTrades: (ITradeStateProps | IDividendStateProps)[] = [
		...trades,
		...dividends,
	]
		.sort((a, b) => {
			if (a.timestamp > b.timestamp) {
				return -1;
			}

			if (a.timestamp < b.timestamp) {
				return 1;
			}

			return 0;
		})
		.slice(0, MAX_ACTIVITY);
	const pnl = ({ averageEntryPrice, quotePrice }: ISidebarPosition) => {
		const amount = (quotePrice - averageEntryPrice) / averageEntryPrice;

		if (Math.abs(amount) < 0.0001) {
			return 0;
		}

		return amount;
	};

	const quotePercentage = ({
		quotePrice,
		previousClosePrice,
	}: ISidebarPosition) => {
		return (quotePrice - previousClosePrice) / quotePrice;
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
				{_.orderBy(
					positions,
					(position) => {
						switch (orderBy) {
							case PositionOrderBy.symbol:
								return position.symbol;
							case PositionOrderBy.profits:
								return pnl(position);
							case PositionOrderBy.quote:
								return quotePercentage(position);
						}
					},
					orderBy == PositionOrderBy.symbol ? 'asc' : 'desc'
				).map((position) => (
					<div className='row position' key={position.symbol}>
						<div className='col-4 pr-0'>
							<div className='d-inline-block'>
								<AssetSymbol symbol={position.symbol} />
							</div>
						</div>
						<div className='col-4 text-right'>
							<ColoredNumbers value={pnl(position)} type='percent' hidePlus />
						</div>
						<div className='col-4 text-right'>
							<Percent percent={quotePercentage(position)} />
						</div>
					</div>
				))}
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
							'isSell' in dividendOrTrade ? (
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
