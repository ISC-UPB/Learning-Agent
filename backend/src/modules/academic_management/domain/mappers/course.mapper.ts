import { Course } from '../entities/course.entity';

export interface CoursePrismaData {
    id: string;
    name: string;
    isActive: boolean;
    teacherId: string;
}

export class CourseMapper {

    static toDomain(data: CoursePrismaData): Course {
        return new Course(
            data.id,
            data.name,
            data.isActive,
            data.teacherId
        );
    }


    static toDomainArray(dataArray: CoursePrismaData[]): Course[] {
        return dataArray.map(data => this.toDomain(data));
    }
}