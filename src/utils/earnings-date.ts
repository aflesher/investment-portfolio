import { IPosition } from "./position";

export interface IEarningsDate {
    timestamp: number,
    symbol: string,
    position?: IPosition
}