export const orderPnL = (
	avgSharePrice: number,
	limitPrice: number,
	quantity: number
) => (limitPrice - avgSharePrice) * quantity;

export const orderSellPriceGap = (quotePrice: number, limitPrice: number) =>
	(limitPrice - quotePrice) / quotePrice;

export const orderBuyPriceGap = (quotePrice: number, limitPrice: number) =>
	(quotePrice - limitPrice) / quotePrice;

export const orderPriceGap = (
	quotePrice: number,
	limitPrice: number,
	isSell: boolean
) => {
	if (!isSell) {
		return orderBuyPriceGap(quotePrice, limitPrice);
	}
	return orderSellPriceGap(quotePrice, limitPrice);
};

export const orderBuyNewAvgPrice = (
	openQuantity: number,
	avgSharePrice: number,
	limitPrice: number,
	orderQuantity: number
) => {
	return (
		(openQuantity * avgSharePrice + limitPrice * orderQuantity) /
		(openQuantity + orderQuantity)
	);
};

export const orderNewAvgPrice = (
	openQuantity: number,
	avgSharePrice: number,
	limitPrice: number,
	orderQuantity: number,
	isSell: boolean
) => {
	if (isSell) {
		return avgSharePrice;
	}

	return orderBuyNewAvgPrice(
		openQuantity,
		avgSharePrice,
		limitPrice,
		orderQuantity
	);
};
