import axios from "axios";
import { getTutorPalAPI } from "@/api/generated/tutorPalAPI";
import { ENV } from "./env";

const axiosInstance = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
});

export const apiClient = getTutorPalAPI(axiosInstance);
