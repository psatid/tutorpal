import { Hono, type MiddlewareHandler } from "hono";
import type { Logger } from "pino";
import type { SocialLoginConfig } from "../lib/app-config";
import { getLocalAuth } from "../lib/auth";
import { getLocalAppConfig } from "../lib/local-config";
import {
	createRequireAdmin,
	createRequireAdminOrigin,
} from "../middleware/admin-auth";
import { requireAuth } from "../middleware/auth";
import {
	adminUserRepository,
	classRepository,
	courseRepository,
	lineRepository,
	scheduleRepository,
	socialAccountRepository,
	studentRepository,
} from "../repositories";
import {
	AdminUserService,
	BetaService,
	ClassService,
	CourseService,
	LineService,
	ScheduleService,
	SocialAccountService,
	StudentService,
} from "../services";
import type { AppEnv } from "../types/hono-env";
import { createAdminUserRoutes } from "./admin-users";
import { createBaseRoutes } from "./base-router";
import { createBetaRoutes } from "./beta";
import { createClassRoutes } from "./classes";
import { createCourseRoutes } from "./courses";
import { createLineRoutes } from "./line";
import { createScheduleRoutes } from "./schedules";
import { createSocialAccountRoutes } from "./social-accounts";
import { createStudentRoutes } from "./students";

export type RouteDependencies = {
	requireAuth: MiddlewareHandler<AppEnv>;
	requireAdmin: MiddlewareHandler<AppEnv>;
	requireAdminOrigin: MiddlewareHandler<AppEnv>;
	adminUserService: AdminUserService;
	classService: ClassService;
	courseService: CourseService;
	lineService: LineService;
	scheduleService: ScheduleService;
	socialAccountService: SocialAccountService;
	studentService: StudentService;
	betaService: BetaService;
	getFrontendUrl(): string;
	isBetaEnabled(): boolean;
	getMarketingOrigin(): string;
	getSocialLogin(): SocialLoginConfig;
};

function createDefaultRouteDependencies(): RouteDependencies {
	const config = getLocalAppConfig();
	const auth = getLocalAuth();

	return {
		requireAuth,
		requireAdmin: createRequireAdmin({ auth }),
		requireAdminOrigin: createRequireAdminOrigin(config.ADMIN_FRONTEND_URL),
		adminUserService: new AdminUserService(adminUserRepository, auth, {
			emailVerificationCallbackUrl: config.EMAIL_VERIFICATION_CALLBACK_URL,
		}),
		classService: new ClassService(classRepository),
		courseService: new CourseService(courseRepository),
		lineService: new LineService(lineRepository, studentRepository),
		scheduleService: new ScheduleService(
			scheduleRepository,
			classRepository,
			config.BETTER_AUTH_SECRET,
		),
		socialAccountService: new SocialAccountService(
			socialAccountRepository,
			config,
		),
		studentService: new StudentService(studentRepository),
		betaService: new BetaService(config),
		getFrontendUrl: () => getLocalAppConfig().FRONTEND_URL,
		isBetaEnabled: () => getLocalAppConfig().BETA_ENABLED,
		getMarketingOrigin: () => getLocalAppConfig().MARKETING_ORIGIN,
		getSocialLogin: () => getLocalAppConfig().SOCIAL_LOGIN,
	};
}

export function createRoutes(
	dependencies: RouteDependencies = createDefaultRouteDependencies(),
	logger?: Pick<Logger, "warn">,
) {
	const fallbackConfig = getLocalAppConfig();
	const betaService =
		dependencies.betaService ?? new BetaService(fallbackConfig);
	const marketingOrigin =
		dependencies.getMarketingOrigin?.() ?? fallbackConfig.MARKETING_ORIGIN;

	return new Hono<AppEnv>()
		.basePath("/v1")
		.route(
			"/",
			createBaseRoutes(
				() => !dependencies.isBetaEnabled(),
				dependencies.getSocialLogin,
			),
		)
		.route(
			"/beta",
			createBetaRoutes({
				betaService,
				marketingOrigin,
			}),
		)
		.route("/admin/users", createAdminUserRoutes(dependencies))
		.route("/students", createStudentRoutes(dependencies))
		.route("/classes", createClassRoutes(dependencies))
		.route("/courses", createCourseRoutes(dependencies))
		.route("/schedules", createScheduleRoutes(dependencies))
		.route(
			"/auth/social-accounts",
			createSocialAccountRoutes({ ...dependencies, logger }),
		)
		.route("/line", createLineRoutes(dependencies));
}

export type AppType = ReturnType<typeof createRoutes>;
