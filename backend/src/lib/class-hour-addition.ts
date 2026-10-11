import { hoursToSeconds } from "./teaching-time";

// Existing hour inputs allow up to eight digits before the decimal point.
export const MAX_CLASS_HOURS = 99_999_999.99;
export const MAX_CLASS_SECONDS = hoursToSeconds(MAX_CLASS_HOURS);
