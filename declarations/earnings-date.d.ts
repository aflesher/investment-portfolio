import { IPosition } from './position';

export interface IEarningsDate {
	date: string;
	symbol: string;
	position?: IPosition;
}
