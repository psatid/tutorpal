import { z } from "zod";

export const MAX_THB_AMOUNT = 9_999_999_999.99;

type OptionalMoneyValidationMessages = {
	precisionError: string;
	rangeError: string;
};

function hasAtMostTwoDecimalPlaces(amount: number) {
	const scaledAmount = amount * 100;
	return (
		Math.abs(scaledAmount - Math.round(scaledAmount)) <=
		Number.EPSILON * Math.max(1, Math.abs(scaledAmount)) * 4
	);
}

export function createOptionalMoneyAmountSchema({
	precisionError,
	rangeError,
}: OptionalMoneyValidationMessages) {
	return z.preprocess(
		(value) => {
			if (value === null || value === undefined) return null;
			if (typeof value === "string") {
				const trimmedValue = value.trim();
				return trimmedValue === "" ? null : Number(trimmedValue);
			}
			return value;
		},
		z.union(
			[
				z.null(),
				z
					.number({ error: rangeError })
					.finite(rangeError)
					.min(0, rangeError)
					.max(MAX_THB_AMOUNT, rangeError)
					.refine(hasAtMostTwoDecimalPlaces, precisionError),
			],
			{ error: rangeError },
		),
	);
}
