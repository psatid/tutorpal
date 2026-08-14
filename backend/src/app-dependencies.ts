import type { PrismaClient } from "@prisma/client";
import type { AppConfig } from "./lib/app-config";
import { type Auth, createAuth } from "./lib/auth-factory";
import { createLineClient, sendLinePushMessage } from "./lib/line";
import { createLineCredentialCipher } from "./lib/line-credentials";
import {
	createRequireAdmin,
	createRequireAdminOrigin,
} from "./middleware/admin-auth";
import { createRequireAuth } from "./middleware/auth";
import {
	AdminUserRepository,
	ClassReminderRepository,
	ClassRepository,
	CourseRepository,
	LineRepository,
	ScheduleRepository,
	StudentRepository,
} from "./repositories";
import type { RouteDependencies } from "./routes";
import {
	AdminUserService,
	ClassReminderService,
	ClassService,
	CourseService,
	LineService,
	ScheduleService,
	StudentService,
} from "./services";

export type ApplicationDependencies = {
	config: AppConfig;
	prisma: PrismaClient;
	auth: Auth;
	routes: RouteDependencies;
};

export function createApplicationDependencies(
	config: AppConfig,
	prisma: PrismaClient,
): ApplicationDependencies {
	const classRepository = new ClassRepository(prisma);
	const adminUserRepository = new AdminUserRepository(prisma);
	const courseRepository = new CourseRepository(prisma);
	const lineRepository = new LineRepository(prisma);
	const scheduleRepository = new ScheduleRepository(prisma);
	const studentRepository = new StudentRepository(prisma);
	const lineClient = createLineClient(config);
	const credentialCipher = createLineCredentialCipher(
		config.LINE_CREDENTIALS_ENCRYPTION_KEY,
	);
	const auth = createAuth(config, prisma);

	return {
		config,
		prisma,
		auth,
		routes: {
			requireAuth: createRequireAuth({ auth, prisma }),
			requireAdmin: createRequireAdmin({ auth }),
			requireAdminOrigin: createRequireAdminOrigin(config.ADMIN_FRONTEND_URL),
			adminUserService: new AdminUserService(adminUserRepository, auth, {
				emailVerificationCallbackUrl: config.EMAIL_VERIFICATION_CALLBACK_URL,
			}),
			classService: new ClassService(classRepository),
			courseService: new CourseService(courseRepository),
			lineService: new LineService(lineRepository, studentRepository, {
				frontendUrl: config.FRONTEND_URL,
				lineClient,
				credentialCipher,
			}),
			scheduleService: new ScheduleService(scheduleRepository, classRepository),
			studentService: new StudentService(studentRepository),
			getFrontendUrl: () => config.FRONTEND_URL,
			isPublicSignupEnabled: () => config.PUBLIC_SIGNUP_ENABLED,
		},
	};
}

export function createClassReminderService(
	config: Pick<AppConfig, "LINE_CREDENTIALS_ENCRYPTION_KEY">,
	prisma: PrismaClient,
) {
	return new ClassReminderService(
		new ClassReminderRepository(prisma),
		undefined,
		{
			lineClient: { sendLinePushMessage },
			credentialCipher: createLineCredentialCipher(
				config.LINE_CREDENTIALS_ENCRYPTION_KEY,
			),
		},
	);
}
