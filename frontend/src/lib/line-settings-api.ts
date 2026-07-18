import { apiClient } from "@/lib/api-client";
import type {
  GetV1LineConnection200,
  PutV1LineConnectionBody,
} from "@/api/generated/models";

export type LineConnectionStatus = GetV1LineConnection200;
export type LineConnectionCredentials = PutV1LineConnectionBody;

export async function getLineConnection(): Promise<LineConnectionStatus> {
  const response = await apiClient.getV1LineConnection();
  return response.data;
}

export async function saveLineConnection(
  credentials: LineConnectionCredentials,
): Promise<LineConnectionStatus> {
  const response = await apiClient.putV1LineConnection(credentials);
  return response.data;
}

export async function startLineTestRecipientAuthorization(): Promise<string> {
  const response = await apiClient.postV1LineConnectionTestRecipientAuthorize();
  return response.data.authUrl;
}

export async function sendLineConnectionTestMessage(): Promise<void> {
  await apiClient.postV1LineConnectionTestMessage();
}
