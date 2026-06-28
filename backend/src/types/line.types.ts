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

export interface UnlinkLineRequestDTO {
	studentId: string;
}

export interface ILineRepository {
	createToken(studentId: string): Promise<{ token: string; expiresAt: Date }>;
	findValidToken(token: string): Promise<{
		id: string;
		studentId: string;
		expiresAt: Date;
		usedAt: Date | null;
	} | null>;
	markTokenUsed(tokenId: string): Promise<void>;
}
