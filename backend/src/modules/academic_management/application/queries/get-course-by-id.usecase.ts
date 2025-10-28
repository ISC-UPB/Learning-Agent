import { Inject, Injectable, Logger } from "@nestjs/common";
import { COURSE_REPO } from "../../tokens";
import type { CourseRepositoryPort } from "../../domain/ports/courses.repository.ports";
import { Course } from "../../domain/entities/course.entity";
import { NotFoundError } from "../../../../shared/handler/errors";

@Injectable()
export class GetCourseByIdUseCase {
    private readonly logger = new Logger(GetCourseByIdUseCase.name);

    constructor(
        @Inject(COURSE_REPO) private readonly courseRepo: CourseRepositoryPort,
    ) {}

    async execute(courseId: string): Promise<Course | null> {
        this.logger.log(`Entry: execute - courseId=${courseId}`);

        try {
            const course = await this.courseRepo.findById(courseId);

            if (!course) {
                this.logger.error(`Course not found - courseId=${courseId}`);
                throw new NotFoundError(`No se ha podido recuperar la información de la materia`);
            }

            const isActive = course.isActive;
            this.logger.log(`Success: course retrieved - courseId=${course.id}, isActive=${isActive}`);
            return isActive ? course : null;
        } catch (error) {
            this.logger.error(`Error in execute - courseId=${courseId}`, error.stack);
            throw error;
        }
    }
}
