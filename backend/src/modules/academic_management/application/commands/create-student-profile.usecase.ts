import { Injectable, Inject, Logger } from '@nestjs/common';
import type { StudentRepositoryPort } from '../../domain/ports/student.repository.ports';
import type { UserServicePort } from '../../domain/ports/user.service.port';
import type { RoleServicePort } from '../../domain/ports/role.service.port';
import type { HasherPort } from '../../domain/ports/hasher.port';
import { InternalServerError } from '../../../../shared/handler/errors';
import { Student } from '../../domain/entities/student.entity';

@Injectable()
export class CreateStudentProfileUseCase {
  private readonly logger = new Logger(CreateStudentProfileUseCase.name);
  private readonly studentRoleName = 'estudiante';

  constructor(
    @Inject('UserServicePort') private readonly userService: UserServicePort,
    @Inject('StudentRepositoryPort') private readonly studentRepo: StudentRepositoryPort,
    @Inject('RoleServicePort') private readonly roleService: RoleServicePort,
    @Inject('HasherPort') private readonly hasher: HasherPort,
  ) {}

  async execute(input: { studentName: string; studentLastname: string; studentCode: string }): Promise<Student> {
    const studentRole = await this.roleService.findRoleByName(this.studentRoleName);
    const studentRoleId = studentRole?.id;
    if (!studentRoleId) {
      this.logger.error(`Error fetching RoleId by name ${this.studentRoleName}`);
      throw new InternalServerError('Ha ocurrido un error intentando crear un nuevo perfil para el estudiante');
    }

    const password = `${this.fixedString(input.studentLastname + input.studentCode)}UPB2025`;
    const hash = await this.hasher.hash(password);

    const email = `${this.fixedString(input.studentName + input.studentLastname + input.studentCode)}@upb.edu`;

    const newUser = await this.userService.createUser(
      input.studentName,
      input.studentLastname,
      email,
      hash,
      true,
      studentRoleId,
    );

    if (!newUser) {
      this.logger.error('Error creating new user');
      throw new InternalServerError('Ha ocurrido un error intentando crear un nuevo perfil para el estudiante.');
    }

    const newStudent = await this.studentRepo.create(newUser.id, input.studentCode);

    if (!newStudent) {
      this.logger.error('Error creating new student');
      throw new InternalServerError('Ha ocurrido un error creando la cuenta del estudiante');
    }
    return newStudent;
  }

  private fixedString(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, '');
  }
}
