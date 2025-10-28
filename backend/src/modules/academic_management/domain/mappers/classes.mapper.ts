import { Classes } from '../entities/classes.entity';

export interface ClassesPrismaData {
    id: string;
    name: string;
    semester: string;
    isActive: boolean;
    dateBegin: Date;
    dateEnd: Date;
    courseId: string;
}

export class ClassesMapper {

    static toDomain(data: ClassesPrismaData): Classes {
        return new Classes(
            data.id,
            data.name,
            data.semester,
            data.isActive,
            new Date(data.dateBegin),
            new Date(data.dateEnd),
            data.courseId
        );
    }


    static toDomainArray(dataArray: ClassesPrismaData[]): Classes[] {
        return dataArray.map(data => this.toDomain(data));
    }
}