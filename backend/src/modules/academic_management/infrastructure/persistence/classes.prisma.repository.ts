import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../core/prisma/prisma.service";
import { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";
import { ClassesMapper } from "../../domain/mappers/classes.mapper";

@Injectable()
export class ClassesPrismaRepository implements ClassesRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Classes | null> {
        const classesData = await this.prisma.classes.findUnique({ where: { id } });
        if (!classesData) return null;
        return ClassesMapper.toDomain(classesData);
    }

    async findByCourseId(courseId: string): Promise<Classes[]> {
        const isActive = true;
        const classesData = await this.prisma.classes.findMany({ where: { courseId, isActive } });
        if (!classesData) return [];
        return ClassesMapper.toDomainArray(classesData);
    };

    async create(name: string, semester: string, courseId: string, dateBegin: Date, dateEnd: Date): Promise<Classes> {
        const newClass = await this.prisma.classes.create({
            data: {
                name,
                semester,
                isActive: true,
                dateBegin,
                dateEnd,
                courseId
            }
        });
        return ClassesMapper.toDomain(newClass);
    }

    async updateInfo(id: string, name: string, semester: string, dateBegin: Date, dateEnd: Date): Promise<Classes> {
        const data: { name?: string; semester?: string; dateBegin?: Date; dateEnd?: Date } = {};
        if (name) data.name = name;
        if (semester) data.semester = semester;
        if (dateBegin) data.dateBegin = dateBegin;
        if (dateEnd) data.dateEnd = dateEnd;

        const updatedClass = await this.prisma.classes.update({
            where: { id },
            data
        });
        return ClassesMapper.toDomain(updatedClass);
    }

    async softDelete(id: string): Promise<Classes> {
        const deletedClass = await this.prisma.classes.update({
            where: { id },
            data: {
                isActive: false
            }
        });
        return ClassesMapper.toDomain(deletedClass);
    }

    async list(): Promise<Classes[]> {
        const rows = await this.prisma.classes.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
        return ClassesMapper.toDomainArray(rows);
    }

}