import type { PrismaClient } from "@prisma/client";
import type { AppConfig } from "./lib/app-config";
import { type Auth, createAuth } from "./lib/auth-factory";
import { createLineClient } from "./lib/line";
import { createLineCredentialCipher } from "./lib/line-credentials";
import { createRequireAuth } from "./middleware/auth";
import {
	ClassReminderRepository,
	ClassRepository,
	CourseRepository,
	LineRepository,
	ScheduleRepository,
	StudentRepository,
} from "./repositories";
import type { RouteDependencies } from "./routes";
import {
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
		},
	};
}

export function createClassReminderService(
	config: AppConfig,
	prisma: PrismaClient,
) {
	return new ClassReminderService(
		new ClassReminderRepository(prisma),
		undefined,
		{
			lineClient: createLineClient(config),
			credentialCipher: createLineCredentialCipher(
				config.LINE_CREDENTIALS_ENCRYPTION_KEY,
			),
		},
	);
}
