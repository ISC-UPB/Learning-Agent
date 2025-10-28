import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/prisma/prisma.service";
import { CourseRepositoryPort } from "../../domain/ports/courses.repository.ports";
import { Course } from "../../domain/entities/course.entity";
import { CourseMapper } from "../../domain/mappers/course.mapper";

@Injectable()
export class CoursePrismaRepository implements CourseRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Course | null> {
        const courseData = await this.prisma.course.findUnique({ where: { id } });
        if (!courseData) return null;
        return CourseMapper.toDomain(courseData);
    }

    async findByTeacherId(teacherId: string): Promise<Course[]> {
        const coursesData = await this.prisma.course.findMany({ where: { teacherId } });
        if (!coursesData) return [];
        return CourseMapper.toDomainArray(coursesData);
    }

    async create(name: string, teacherId: string): Promise<Course> {
        const newCourse = await this.prisma.course.create({
            data: {
                name,
                teacherId
            }
        })
        return CourseMapper.toDomain(newCourse);
    }

    async softDelete(id: string): Promise<Course> {
        const deletedCourse = await this.prisma.course.update({
            where: { id },
            data: {
                isActive: false
            }
        });
        return CourseMapper.toDomain(deletedCourse);
    }

    async list(): Promise<Course[]> {
        const rows = await this.prisma.course.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
        return CourseMapper.toDomainArray(rows);
    }
}