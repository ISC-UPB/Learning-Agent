import { Attendance } from '../entities/attendance.entity';

export interface AttendancePrismaData {
    id: string;
    studentId: string;
    classId: string;
    date: Date;
    isPresent: boolean;
}

export class AttendanceMapper {
    static toDomain(data: AttendancePrismaData): Attendance {
        return new Attendance(
            data.id,
            data.studentId,
            data.classId,
            data.date,
            data.isPresent
        );
    }

    static toDomainArray(dataArray: AttendancePrismaData[]): Attendance[] {
        return dataArray.map(data => this.toDomain(data));
    }
}