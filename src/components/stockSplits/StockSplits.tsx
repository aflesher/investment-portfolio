import React from 'react';
import { IStockSplit } from '../../../declarations/stock-split';

interface StockSplitProps {
	stockSplits: IStockSplit[];
	hideSymbols: boolean;
}

const StockSplits: React.FC<StockSplitProps> = ({
	stockSplits,
	hideSymbols,
}) => {
	return (
		<div>
			{stockSplits.map(({ date, ratio, isReverse }) => (
				<div className='row' key={date}>
					<div className='col-6'>{date}</div>
					<div className='col-6'>
						{isReverse && <>1:{ratio}</>}
						{!isReverse && <>{ratio}:1</>}
					</div>
				</div>
			))}
		</div>
	);
};

export default StockSplits;
