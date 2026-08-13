import { getAppLanguage } from "@/lib/i18n/config";

export const DateTime = {
	formatDate(timestamp: string) {
		return new Intl.DateTimeFormat(
			getAppLanguage() === "th" ? "th-TH-u-ca-gregory-nu-latn" : "en",
			{ day: "numeric", month: "short", year: "numeric" },
		).format(new Date(timestamp));
	},
};
