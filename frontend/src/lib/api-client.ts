import axios from "axios";
import { getTutorPalAPI } from "@/api/generated/tutorPalAPI";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export const apiClient = getTutorPalAPI(axiosInstance);
