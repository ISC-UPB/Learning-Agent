import { Student } from '../entities/student.entity';

export interface StudentPrismaData {
    userId: string;
    code: string;
    career?: string | null;
    admissionYear?: number | null;
}

export class StudentMapper {
    static toDomain(data: StudentPrismaData): Student {
        return new Student(
            data.userId,
            data.code,
            data.career || undefined,
            data.admissionYear || undefined
        );
    }

    static toDomainArray(dataArray: StudentPrismaData[]): Student[] {
        return dataArray.map(data => this.toDomain(data));
    }
}