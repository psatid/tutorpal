import { AppError } from "../lib/error";
import { classRepository } from "../repositories";
import type {
	CreateScheduleDTO,
	IScheduleRepository,
	ScheduleDTO,
	UpdateScheduleDTO,
} from "../types";

export class ScheduleService {
	constructor(private readonly repository: IScheduleRepository) {}

	async createSchedule(data: CreateScheduleDTO): Promise<ScheduleDTO> {
		// Verify that the class exists
		const classData = await classRepository.findById(data.classId);
		if (!classData) {
			throw AppError.badRequest(
				"CLASS_NOT_FOUND",
				"The specified class does not exist",
			);
		}

		return this.repository.create(data);
	}

	async getAllSchedules(): Promise<ScheduleDTO[]> {
		return this.repository.findAll();
	}

	async getScheduleById(id: string): Promise<ScheduleDTO> {
		const schedule = await this.repository.findById(id);
		if (!schedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}
		return schedule;
	}

	async updateSchedule(id: string, data: UpdateScheduleDTO): Promise<ScheduleDTO> {
		// Check if schedule exists first
		const existingSchedule = await this.repository.findById(id);
		if (!existingSchedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}

		// If classId is being updated, verify the new class exists
		if (data.classId !== undefined) {
			const classData = await classRepository.findById(data.classId);
			if (!classData) {
				throw AppError.badRequest(
					"CLASS_NOT_FOUND",
					"The specified class does not exist",
				);
			}
		}

		return this.repository.update(id, data);
	}

	async deleteSchedule(id: string): Promise<void> {
		// Check if schedule exists first
		const existingSchedule = await this.repository.findById(id);
		if (!existingSchedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}

		await this.repository.delete(id);
	}
}
