import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { EnrollmentRepositoryPort } from '../../domain/ports/enrollment.repository.ports';
import { Enrollment } from '../../domain/entities/enrollment.entity';
import { EnrollmentMapper } from '../../domain/mappers/enrollment.mapper';

@Injectable()
export class EnrollmentPrismaRepository implements EnrollmentRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findByStudentId(studentId: string): Promise<Enrollment[]> {
        const enrollmentData = await this.prisma.enrollment.findMany({ where: { studentId } });
        if (!enrollmentData) return [];
        return EnrollmentMapper.toDomainArray(enrollmentData);
    };

    async findByClassId(classId: string): Promise<Enrollment[]> {
        const enrollmentData = await this.prisma.enrollment.findMany({ where: { classId } });
        if (!enrollmentData) return [];
        return EnrollmentMapper.toDomainArray(enrollmentData);
    };

    async findByStudentAndClass(studentId: string, classId: string): Promise<Enrollment | null> {
        const e = await this.prisma.enrollment.findUnique({
            where: {
                studentId_classId: {
                    studentId,
                    classId,
                },
            },
        });

        if (!e) return null;

        return EnrollmentMapper.toDomain(e);
    }

    async create(studentId: string, classId: string): Promise<Enrollment> {
        const newEnrollment = await this.prisma.enrollment.create({
            data: {
                studentId,
                classId,
                isActive: true
            }
        });
        return EnrollmentMapper.toDomain(newEnrollment);
    }

    async list(): Promise<Enrollment[]> {
        const rows = await this.prisma.enrollment.findMany();
        return EnrollmentMapper.toDomainArray(rows);
    };

    async softDelete(studentId: string, classId: string): Promise<Enrollment> {
        const deletedEnrollment = await this.prisma.enrollment.update({
            where: {
                studentId_classId: {
                    studentId,
                    classId,
                },
            },
            data: {
                isActive: false,
            },
        });
        return EnrollmentMapper.toDomain(deletedEnrollment);
    };

    async enableEnrollment(studentId: string, classId: string): Promise<Enrollment> {
        const enabledEnrollment = await this.prisma.enrollment.update({
            where: {
                studentId_classId: {
                    studentId,
                    classId,
                },
            },
            data: {
                isActive: true,
            },
        });
        return EnrollmentMapper.toDomain(enabledEnrollment);
    };
}