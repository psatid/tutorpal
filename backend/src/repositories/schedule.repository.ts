import { prisma } from "../lib/db";
import type {
  CreateScheduleDTO,
  IScheduleRepository,
  ScheduleDTO,
  UpdateScheduleDTO,
} from "../types";

// Helper to convert Prisma Schedule with class relation to DTO
function toDTO(schedule: {
  id: string;
  classId: string;
  date: Date;
  time: number;
  durationMinutes: number;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
  class: {
    name: string;
  };
}): ScheduleDTO {
  return {
    id: schedule.id,
    classId: schedule.classId,
    className: schedule.class.name,
    date: schedule.date.toISOString(),
    time: schedule.time,
    durationMinutes: schedule.durationMinutes,
    notes: schedule.notes,
    status: schedule.status,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  };
}

export class ScheduleRepository implements IScheduleRepository {
  async create(data: CreateScheduleDTO): Promise<ScheduleDTO> {
    const schedule = await prisma.schedule.create({
      data: {
        classId: data.classId,
        date: new Date(data.date),
        time: data.time,
        durationMinutes: data.durationMinutes,
        notes: data.notes || null,
        status: data.status || "SCHEDULED",
      },
      include: {
        class: true,
      },
    });
    return toDTO(schedule);
  }

  async findAll(): Promise<ScheduleDTO[]> {
    const schedules = await prisma.schedule.findMany({
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        class: true,
      },
    });
    return schedules.map(toDTO);
  }

  async findById(id: string): Promise<ScheduleDTO | null> {
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });
    return schedule ? toDTO(schedule) : null;
  }

  async update(id: string, data: UpdateScheduleDTO): Promise<ScheduleDTO> {
    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.time !== undefined && { time: data.time }),
        ...(data.durationMinutes !== undefined && {
          durationMinutes: data.durationMinutes,
        }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        class: true,
      },
    });
    return toDTO(schedule);
  }

  async delete(id: string): Promise<void> {
    await prisma.schedule.delete({
      where: { id },
    });
  }
}

// Singleton instance for dependency injection
export const scheduleRepository = new ScheduleRepository();
