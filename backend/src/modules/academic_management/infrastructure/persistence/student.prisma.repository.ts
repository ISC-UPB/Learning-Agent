import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { StudentRepositoryPort } from '../../domain/ports/student.repository.ports';
import { Student } from '../../domain/entities/student.entity';
import { StudentMapper } from '../../domain/mappers/student.mapper';

@Injectable()
export class StudentPrismaRepository implements StudentRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }
    async findByCode(code: string): Promise<Student | null> {
        const student = await this.prisma.studentProfile.findUnique({ where: { code } });
        if (!student) return null;
        return StudentMapper.toDomain(student);
    }

    async findByUserId(userId: string): Promise<Student | null> {
        const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
        if (!student) return null;
        return StudentMapper.toDomain(student);
    };

    async create(userId: string, code: string, career?: string, admissionYear?: number): Promise<Student> {
        const newStudent = await this.prisma.studentProfile.create({
            data: {
                userId,
                code,
                career,
                admissionYear
            }
        });
        return StudentMapper.toDomain(newStudent);
    }

    async list(): Promise<Student[]> {
        const rows = await this.prisma.studentProfile.findMany();
        return StudentMapper.toDomainArray(rows);
    };
}