import type { Prisma, PrismaClient } from "@prisma/client";
import type { Auth } from "./auth-factory";
import { AppError } from "./error";

export const IMPERSONATE_USER_PATH = "/api/auth/admin/impersonate-user";

const MAX_IMPERSONATION_REQUEST_BYTES = 16 * 1024;
const MAX_IMPERSONATION_USER_ID_LENGTH = 512;

type LockedUser = {
	banned: boolean | null;
	id: string;
	role: string | null;
};

type LockedTutor = {
	id: string;
};

type NativeStartResponseDetails = {
	impersonatedBy?: string;
	impersonationSessionId?: string;
	sessionUserId?: string;
	userId?: string;
};

export type AuthImpersonationStartResult = {
	actorUserId?: string;
	impersonationSessionId?: string;
	response: Response;
	targetUserId?: string;
};

function appErrorResponse(error: AppError): Response {
	return new Response(
		JSON.stringify({
			errorCode: error.errorCode,
			message: error.message,
		}),
		{
			status: error.status,
			headers: { "Content-Type": "application/json" },
		},
	);
}

export function createImpersonationUserNotFoundResponse() {
	return appErrorResponse(
		AppError.notFound("USER_NOT_FOUND", "User not found"),
	);
}

function createImpersonationFailureResponse() {
	return appErrorResponse(
		new AppError("INTERNAL_ERROR", "An unexpected error occurred"),
	);
}

export function isImpersonationStartPath(pathname: string) {
	return (
		pathname === IMPERSONATE_USER_PATH ||
		pathname.startsWith(`${IMPERSONATE_USER_PATH}/`)
	);
}

async function readBoundedRequestBody(request: Request) {
	const contentLength = request.headers.get("Content-Length");
	if (contentLength !== null) {
		if (!/^\d+$/.test(contentLength)) return undefined;
		const length = Number(contentLength);
		if (
			!Number.isSafeInteger(length) ||
			length > MAX_IMPERSONATION_REQUEST_BYTES
		) {
			return undefined;
		}
	}

	const reader = (() => {
		try {
			return request.clone().body?.getReader();
		} catch {
			return undefined;
		}
	})();
	if (!reader) return undefined;

	const chunks: Uint8Array[] = [];
	let length = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (!value) continue;

			length += value.byteLength;
			if (length > MAX_IMPERSONATION_REQUEST_BYTES) {
				await reader.cancel();
				return undefined;
			}
			chunks.push(value);
		}
	} catch {
		return undefined;
	} finally {
		reader.releaseLock();
	}

	const bytes = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(bytes);
}

async function parseTargetUserId(request: Request) {
	const body = await readBoundedRequestBody(request);
	if (!body) return undefined;

	try {
		const parsed = JSON.parse(body) as unknown;
		if (
			typeof parsed !== "object" ||
			parsed === null ||
			Array.isArray(parsed)
		) {
			return undefined;
		}

		const { userId } = parsed as { userId?: unknown };
		if (
			typeof userId !== "string" ||
			userId.length === 0 ||
			userId.length > MAX_IMPERSONATION_USER_ID_LENGTH
		) {
			return undefined;
		}

		return userId;
	} catch {
		return undefined;
	}
}

async function getNativeStartResponseDetails(
	response: Response,
): Promise<NativeStartResponseDetails> {
	try {
		const body = (await response.clone().json()) as unknown;
		if (typeof body !== "object" || body === null) return {};

		const { session, user } = body as { session?: unknown; user?: unknown };
		const sessionRecord =
			typeof session === "object" && session !== null
				? (session as Record<string, unknown>)
				: undefined;
		const userRecord =
			typeof user === "object" && user !== null
				? (user as Record<string, unknown>)
				: undefined;

		return {
			impersonatedBy:
				typeof sessionRecord?.impersonatedBy === "string"
					? sessionRecord.impersonatedBy
					: undefined,
			impersonationSessionId:
				typeof sessionRecord?.id === "string" ? sessionRecord.id : undefined,
			sessionUserId:
				typeof sessionRecord?.userId === "string"
					? sessionRecord.userId
					: undefined,
			userId: typeof userRecord?.id === "string" ? userRecord.id : undefined,
		};
	} catch {
		return {};
	}
}

async function getNewActorImpersonationSessionIds(
	tx: Prisma.TransactionClient,
	actorUserId: string,
	targetUserId: string,
	existingSessionIds: Set<string>,
) {
	const sessions = await tx.session.findMany({
		where: {
			impersonatedBy: actorUserId,
			userId: targetUserId,
		},
		select: { id: true },
	});
	return sessions
		.map((session) => session.id)
		.filter((sessionId) => !existingSessionIds.has(sessionId));
}

async function revokeNewActorImpersonationSessions(
	tx: Prisma.TransactionClient,
	actorUserId: string,
	targetUserId: string,
	sessionIds: string[],
) {
	if (sessionIds.length === 0) return;

	await tx.session.deleteMany({
		where: {
			id: { in: sessionIds },
			impersonatedBy: actorUserId,
			userId: targetUserId,
		},
	});
}

async function revokeRootActorImpersonationSessions(
	prisma: PrismaClient,
	actorUserId: string,
	targetUserId: string,
	sessionIds: string[],
) {
	if (sessionIds.length === 0) return;

	await prisma.session.deleteMany({
		where: {
			id: { in: sessionIds },
			impersonatedBy: actorUserId,
			userId: targetUserId,
		},
	});
}

function isValidNativeStartResponse(
	response: Response,
	responseDetails: NativeStartResponseDetails,
	actorUserId: string,
	targetUserId: string,
	newSessionIds: string[],
) {
	return (
		response.ok &&
		responseDetails.userId === targetUserId &&
		responseDetails.sessionUserId === targetUserId &&
		responseDetails.impersonatedBy === actorUserId &&
		responseDetails.impersonationSessionId !== undefined &&
		newSessionIds.includes(responseDetails.impersonationSessionId)
	);
}

export function createAuthImpersonationStartHandler({
	auth,
	prisma,
	adminOrigin,
}: {
	auth: Auth;
	prisma: PrismaClient;
	adminOrigin: string;
}) {
	return async (request: Request): Promise<AuthImpersonationStartResult> => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session || typeof session.user.id !== "string") {
			return {
				response: appErrorResponse(
					AppError.unauthorized("UNAUTHORIZED", "Authentication required"),
				),
			};
		}
		if (session.user.role !== "admin") {
			return {
				response: appErrorResponse(
					AppError.forbidden("ADMIN_REQUIRED", "Administrator access required"),
				),
			};
		}

		const actorUserId = session.user.id;
		if (request.headers.get("Origin") !== adminOrigin) {
			return {
				actorUserId,
				response: appErrorResponse(
					AppError.forbidden("ADMIN_ORIGIN_REQUIRED", "Invalid request origin"),
				),
			};
		}

		const requestedTargetUserId = await parseTargetUserId(request);
		if (!requestedTargetUserId) {
			return {
				actorUserId,
				response: createImpersonationUserNotFoundResponse(),
			};
		}

		const cleanupSessionIds = new Set<string>();
		let cleanupTargetUserId: string | undefined;

		try {
			return await prisma.$transaction(async (tx) => {
				const lockedUsers = await tx.$queryRaw<LockedUser[]>`
				SELECT "id", "role", "banned"
				FROM "user"
				WHERE "id" = ${requestedTargetUserId}
				FOR NO KEY UPDATE
			`;
				const lockedUser = lockedUsers[0];
				if (!lockedUser) {
					return {
						actorUserId,
						response: createImpersonationUserNotFoundResponse(),
					};
				}
				cleanupTargetUserId = lockedUser.id;

				const lockedTutors = await tx.$queryRaw<LockedTutor[]>`
				SELECT "id"
				FROM "tutors"
				WHERE "userId" = ${lockedUser.id}
				FOR NO KEY UPDATE
			`;
				const lockedTutor = lockedTutors[0];
				if (
					lockedUser.role !== "user" ||
					lockedUser.banned === true ||
					!lockedTutor
				) {
					return {
						actorUserId,
						response: createImpersonationUserNotFoundResponse(),
					};
				}

				const existingSessions = await tx.session.findMany({
					where: {
						impersonatedBy: actorUserId,
						userId: lockedUser.id,
					},
					select: { id: true },
				});
				const existingSessionIds = new Set(
					existingSessions.map((existingSession) => existingSession.id),
				);

				let nativeResponse: Response;
				try {
					nativeResponse = await auth.handler(request);
				} catch {
					const newSessionIds = await getNewActorImpersonationSessionIds(
						tx,
						actorUserId,
						lockedUser.id,
						existingSessionIds,
					);
					for (const sessionId of newSessionIds) {
						cleanupSessionIds.add(sessionId);
					}
					await revokeNewActorImpersonationSessions(
						tx,
						actorUserId,
						lockedUser.id,
						newSessionIds,
					);
					return {
						actorUserId,
						response: createImpersonationFailureResponse(),
					};
				}

				const responseDetails =
					await getNativeStartResponseDetails(nativeResponse);
				const candidateSessionId =
					nativeResponse.ok &&
					typeof responseDetails.impersonationSessionId === "string" &&
					responseDetails.sessionUserId === lockedUser.id &&
					responseDetails.impersonatedBy === actorUserId &&
					!existingSessionIds.has(responseDetails.impersonationSessionId)
						? responseDetails.impersonationSessionId
						: undefined;
				if (candidateSessionId) {
					cleanupSessionIds.add(candidateSessionId);
				}
				const newSessionIds = await getNewActorImpersonationSessionIds(
					tx,
					actorUserId,
					lockedUser.id,
					existingSessionIds,
				);
				for (const sessionId of newSessionIds) {
					cleanupSessionIds.add(sessionId);
				}
				const validatedSessionId = responseDetails.impersonationSessionId;
				const validatedTargetUserId = responseDetails.userId;
				if (
					validatedSessionId &&
					validatedTargetUserId &&
					isValidNativeStartResponse(
						nativeResponse,
						responseDetails,
						actorUserId,
						lockedUser.id,
						newSessionIds,
					)
				) {
					cleanupSessionIds.clear();
					cleanupSessionIds.add(validatedSessionId);
					return {
						actorUserId,
						impersonationSessionId: validatedSessionId,
						response: nativeResponse,
						targetUserId: validatedTargetUserId,
					};
				}

				if (!nativeResponse.ok && newSessionIds.length === 0) {
					return { actorUserId, response: nativeResponse };
				}

				await revokeNewActorImpersonationSessions(
					tx,
					actorUserId,
					lockedUser.id,
					newSessionIds,
				);
				return {
					actorUserId,
					response: createImpersonationFailureResponse(),
				};
			});
		} catch {
			try {
				if (cleanupTargetUserId && cleanupSessionIds.size > 0) {
					await revokeRootActorImpersonationSessions(
						prisma,
						actorUserId,
						cleanupTargetUserId,
						[...cleanupSessionIds],
					);
				}
			} catch {
				// Cleanup is best-effort; always return the safe generic failure.
			}

			return {
				actorUserId,
				response: createImpersonationFailureResponse(),
			};
		}
	};
}
