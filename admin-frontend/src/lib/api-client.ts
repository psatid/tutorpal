import axios from "axios";
import { getTutorPalAPI } from "@/api/generated/tutorPalAPI";
import { ENV } from "./env";

type ApiErrorResponse = {
	errorCode?: unknown;
};

export const axiosInstance = axios.create({
	baseURL: ENV.API_URL,
	withCredentials: true,
});

export const apiClient = getTutorPalAPI(axiosInstance);

export function getApiErrorCode(error: unknown) {
	if (!axios.isAxiosError<ApiErrorResponse>(error)) return undefined;

	const data: unknown = error.response?.data;
	if (data === null || typeof data !== "object" || Array.isArray(data)) {
		return undefined;
	}

	const errorCode = (data as ApiErrorResponse).errorCode;
	return typeof errorCode === "string" ? errorCode : undefined;
}
