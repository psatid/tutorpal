import type { LineConnectionStatus } from "@/lib/line-settings-api";
import { useFetchLineConnection } from "./use-fetch-line-connection";

export type LineConnection = {
	configured: boolean;
	accountName?: string;
	accountBasicId?: string | null;
	lastVerifiedAt?: string;
	testRecipientConnected: boolean;
};

const selectLineConnection = (
	data: LineConnectionStatus | undefined,
): LineConnection | undefined =>
	data
		? {
			configured: data.configured,
			accountName: data.accountName,
			accountBasicId: data.accountBasicId,
			lastVerifiedAt: data.lastVerifiedAt,
			testRecipientConnected: data.testRecipientConnected,
		}
		: undefined;

export const useLineConnection = () =>
	useFetchLineConnection({ select: selectLineConnection });
