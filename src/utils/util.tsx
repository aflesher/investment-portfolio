import numeral from 'numeral';

export const displayMarketCap = (value: number): string => numeral(value).format('$1.00 a');