export interface GenerateLinkTokenDTO {
	studentId: string;
}

export interface LinkTokenResponseDTO {
	token: string;
	linkUrl: string;
	expiresAt: string;
}

export interface LineAuthUrlDTO {
	authUrl: string;
}

export interface SaveLineConnectionDTO {
	messagingAccessToken: string;
	loginChannelId: string;
	loginChannelSecret: string;
}

export interface LineConnectionDTO {
	configured: boolean;
	accountName?: string;
	accountBasicId?: string | null;
	lastVerifiedAt?: string;
	testRecipientConnected: boolean;
}

export interface StoredLineConnection {
	id: string;
	tutorId: string;
	messagingAccessTokenEncrypted: string;
	loginChannelId: string;
	loginChannelSecretEncrypted: string;
	accountName: string;
	accountBasicId: string | null;
	botUserId: string;
	testRecipientLineUserId: string | null;
	lastVerifiedAt: Date;
}

export interface UnlinkLineRequestDTO {
	studentId: string;
}

export interface ILineRepository {
	createToken(
		studentId: string,
		connectionId: string,
	): Promise<{ token: string; expiresAt: Date }>;
	findValidToken(token: string): Promise<{
		id: string;
		studentId: string;
		connectionId: string;
		expiresAt: Date;
		usedAt: Date | null;
	} | null>;
	markTokenUsed(tokenId: string): Promise<void>;
	findConnectionByTutorId(
		tutorId: string,
	): Promise<StoredLineConnection | null>;
	findConnectionById(id: string): Promise<StoredLineConnection | null>;
	upsertConnection(
		data: Omit<StoredLineConnection, "id" | "lastVerifiedAt">,
	): Promise<StoredLineConnection>;
	createTestRecipientToken(
		connectionId: string,
	): Promise<{ token: string; expiresAt: Date }>;
	findValidTestRecipientToken(token: string): Promise<{
		id: string;
		connectionId: string;
		expiresAt: Date;
		usedAt: Date | null;
	} | null>;
	markTestRecipientTokenUsed(tokenId: string): Promise<void>;
	setTestRecipient(connectionId: string, lineUserId: string): Promise<void>;
}
