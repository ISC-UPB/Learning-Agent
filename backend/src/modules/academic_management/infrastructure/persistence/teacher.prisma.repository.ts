import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { ProfessorRepositoryPort } from '../../domain/ports/teacher.repository.ports';
import { Teacher } from '../../domain/entities/teacher.entity';
import { TeacherMapper } from '../../domain/mappers/teacher.mapper';

@Injectable()
export class TeacherPrismaRepository implements ProfessorRepositoryPort {
    constructor(private readonly prisma: PrismaService) { };

    async findByUserId(userId: string): Promise<Teacher | null> {
        const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId } });
        if (!teacher) return null;
        return TeacherMapper.toDomain(teacher);
    }

    async create(userId: string, academicUnit?: string, title?: string, bio?: string): Promise<Teacher> {
        const newTeacher = await this.prisma.teacherProfile.create({
            data: {
                userId,
                academicUnit,
                title,
                bio
            }
        });
        return TeacherMapper.toDomain(newTeacher);
    };

    async list(): Promise<Teacher[]> {
        const rows = await this.prisma.teacherProfile.findMany();
        return TeacherMapper.toDomainArray(rows);
    };

}