import { Inject, Injectable } from "@nestjs/common";
import { CLASSES_REPO } from "../../tokens";
import type { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";
import { NotFoundError } from "src/shared/handler/errors";

@Injectable()
export class GetClassByIdUseCase {
    constructor(
        @Inject(CLASSES_REPO) private readonly classesRepo: ClassesRepositoryPort,
    ) {}

    async execute(classId: string): Promise<Classes | null> {
        const objClass = await this.classesRepo.findById(classId);

        if (!objClass) {
            throw new NotFoundError(`Class not found with Id ${classId}`)
        }
        
        if (objClass?.isActive) return objClass;
        return null;
    }
}