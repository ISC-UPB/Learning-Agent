import { Teacher } from '../entities/teacher.entity';

export interface TeacherPrismaData {
    userId: string;
    academicUnit?: string | null;
    title?: string | null;
    bio?: string | null;
}

export class TeacherMapper {

    static toDomain(data: TeacherPrismaData): Teacher {
        return new Teacher(
            data.userId,
            data.academicUnit || undefined,
            data.title || undefined,
            data.bio || undefined
        );
    }


    static toDomainArray(dataArray: TeacherPrismaData[]): Teacher[] {
        return dataArray.map(data => this.toDomain(data));
    }
}