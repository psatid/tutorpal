import { DateTime } from "../lib/date-time";
import type { AdminUserDTO, AdminUserStatus } from "../types/admin-user.types";

type AdminUserModelProps = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	banned: boolean | null;
	createdAt: Date;
	updatedAt: Date;
};

export class AdminUserModel {
	constructor(private readonly props: AdminUserModelProps) {}

	get id() {
		return this.props.id;
	}

	get email() {
		return this.props.email;
	}

	get emailVerified() {
		return this.props.emailVerified;
	}

	static fromPrisma(user: AdminUserModelProps): AdminUserModel {
		return new AdminUserModel(user);
	}

	toAdminUserDTO(): AdminUserDTO {
		const status: AdminUserStatus = this.props.banned
			? "deactivated"
			: "active";

		return {
			id: this.props.id,
			name: this.props.name,
			email: this.props.email,
			emailVerified: this.props.emailVerified,
			status,
			createdAt: DateTime.from(this.props.createdAt).toISOString(),
			updatedAt: DateTime.from(this.props.updatedAt).toISOString(),
		};
	}
}
