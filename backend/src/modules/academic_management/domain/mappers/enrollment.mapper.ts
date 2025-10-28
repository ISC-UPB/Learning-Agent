import { Enrollment } from '../entities/enrollment.entity';

export interface EnrollmentPrismaData {
    studentId: string;
    classId: string;
    isActive: boolean;
}

export class EnrollmentMapper {
    static toDomain(data: EnrollmentPrismaData): Enrollment {
        return new Enrollment(
            data.studentId,
            data.classId,
            data.isActive
        );
    }

    static toDomainArray(dataArray: EnrollmentPrismaData[]): Enrollment[] {
        return dataArray.map(data => this.toDomain(data));
    }
}