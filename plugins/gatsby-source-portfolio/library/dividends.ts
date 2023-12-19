import { IDividendV2 } from '../../../declarations';
import * as questrade from './questrade';

export const getDividends = async (): Promise<IDividendV2[]> => {
	return questrade.getDividends();
};
