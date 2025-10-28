import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { AttendanceRepositoryPort } from "../../domain/ports/attendance.repository.ports";
import { Attendance } from "../../domain/entities/attendance.entity";
import { AttendanceMapper } from "../../domain/mappers/attendance.mapper";

@Injectable()
export class AttendancePrismaRepository implements AttendanceRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }
    async findByStudentClassAndDate(studentId: string, classId: string, date: Date): Promise<Attendance | null> {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        const attendance = await this.prisma.attendance.findFirst({
            where: {
                studentId,
                classId,
                date: {
                    gte: start,
                    lte: end,
                },
            },
        });

        if (!attendance) return null;

        return AttendanceMapper.toDomain(attendance);
    }

    async findByClassId(classId: string): Promise<Attendance[]> {
        const attendanceData = await this.prisma.attendance.findMany({ where: { classId } })
        if (!attendanceData) return []
        return AttendanceMapper.toDomainArray(attendanceData);
    }

    async findByStudentAndClass(studentId: string, classId: string): Promise<Attendance[]> {
        const attendanceData = await this.prisma.attendance.findMany({ where: { studentId, classId } })
        if (!attendanceData) return []
        return AttendanceMapper.toDomainArray(attendanceData);
    }

    async countAttendanceByStudentAndClass(studentId: string, classId: string): Promise<number> {
        return await this.prisma.attendance.count({
            where: {
                studentId,
                classId,
                isPresent: true,
            },
        });
    }

    async countAbsenceByStudentAndClass(studentId: string, classId: string): Promise<number> {
        return await this.prisma.attendance.count({
            where: {
                studentId,
                classId,
                isPresent: false,
            },
        });
    }

    async create(studentId: string, classId: string, date: Date, isPresent: boolean = true): Promise<Attendance> {
        const attendance = await this.prisma.attendance.create({
            data: {
                studentId,
                classId,
                date,
                isPresent,
            },
        });

        return AttendanceMapper.toDomain(attendance);
    }
}