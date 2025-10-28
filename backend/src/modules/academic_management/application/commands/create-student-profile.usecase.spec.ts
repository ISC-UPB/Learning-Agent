import { CreateStudentProfileUseCase } from './create-student-profile.usecase';
import { InternalServerError } from '../../../../shared/handler/errors';
import { Student } from '../../domain/entities/student.entity';
import { Logger } from '@nestjs/common';
import type { UserServicePort } from '../../domain/ports/user.service.port';
import type { RoleServicePort } from '../../domain/ports/role.service.port';
import type { HasherPort } from '../../domain/ports/hasher.port';
import type { StudentRepositoryPort } from '../../domain/ports/student.repository.ports';

describe('CreateStudentProfileUseCase', () => {
  let useCase: CreateStudentProfileUseCase;
  let userService: jest.Mocked<UserServicePort>;
  let studentRepo: jest.Mocked<StudentRepositoryPort>;
  let roleService: jest.Mocked<RoleServicePort>;
  let hasher: jest.Mocked<HasherPort>;

  beforeEach(() => {
    userService = { createUser: jest.fn() };
    roleService = { findRoleByName: jest.fn() };
    hasher = { hash: jest.fn() };

    studentRepo = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByCode: jest.fn(),
      list: jest.fn(),
    };

    useCase = new CreateStudentProfileUseCase(
      userService,
      studentRepo,
      roleService,
      hasher,
    );

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should create student profile successfully', async () => {
    const input = { studentName: 'John', studentLastname: 'Doe', studentCode: 'S001' };

    roleService.findRoleByName.mockResolvedValue({ id: 'role1' });
    hasher.hash.mockResolvedValue('mock-hash(does001UPB2025)');
    userService.createUser.mockResolvedValue({ id: 'user1' });
    studentRepo.create.mockResolvedValue(new Student('student-123', 'user1', 'S001'));

    const result = await useCase.execute(input);

    expect(roleService.findRoleByName).toHaveBeenCalledWith('estudiante');
    expect(hasher.hash).toHaveBeenCalledWith('does001UPB2025');
    expect(userService.createUser).toHaveBeenCalledWith(
      'John',
      'Doe',
      'johndoes001@upb.edu',
      'mock-hash(does001UPB2025)',
      true,
      'role1',
    );
    expect(studentRepo.create).toHaveBeenCalledWith('user1', 'S001');
    expect(result).toBeInstanceOf(Student);
  });

  it('should throw InternalServerError if role not found', async () => {
    roleService.findRoleByName.mockResolvedValue(null);

    await expect(
      useCase.execute({ studentName: 'Jane', studentLastname: 'Smith', studentCode: 'S002' }),
    ).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError if user creation fails', async () => {
    roleService.findRoleByName.mockResolvedValue({ id: 'role1' });
    hasher.hash.mockResolvedValue('mock-hash');
    userService.createUser.mockResolvedValue(null);

    await expect(
      useCase.execute({ studentName: 'Jane', studentLastname: 'Smith', studentCode: 'S002' }),
    ).rejects.toBeInstanceOf(InternalServerError);
  });

  it('should throw InternalServerError if student creation fails', async () => {
    roleService.findRoleByName.mockResolvedValue({ id: 'role1' });
    hasher.hash.mockResolvedValue('mock-hash');
    userService.createUser.mockResolvedValue({ id: 'user2' });

    // 👇 Cast explícito para permitir null como retorno
    studentRepo.create.mockResolvedValue(null as unknown as Student);

    await expect(
      useCase.execute({ studentName: 'Jane', studentLastname: 'Smith', studentCode: 'S002' }),
    ).rejects.toBeInstanceOf(InternalServerError);
  });
});
