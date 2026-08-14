export const MAX_CURRENCY_AMOUNT = 9_999_999_999.99;

export function hasAtMostTwoDecimalPlaces(amount: number) {
	const scaledAmount = amount * 100;
	return (
		Math.abs(scaledAmount - Math.round(scaledAmount)) <=
		Number.EPSILON * Math.max(1, Math.abs(scaledAmount)) * 4
	);
}

export function normalizeCurrencyAmount(amount: number) {
	return Math.round(amount * 100) / 100;
}
