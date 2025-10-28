import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import {
  responseAlreadyCreated,
  responseConflict,
  responseCreated,
  responseForbidden,
  responseInternalServerError,
  responseNotFound,
  responseSuccess,
} from 'src/shared/handler/http.handler';
import { getFullPath } from 'src/shared/utils/path-util';
import { CreateClassUseCase } from '../../application/commands/create-class.usecase';
import { CreateClassDto } from './dtos/create-classes.dto';
import { ListClassesUseCase } from '../../application/queries/list-classes.usecase';
import { ListStudentsUseCase } from '../../application/queries/list-student.usecase';
import { GetClassesByStudentUseCase } from '../../application/queries/get-classes-by-student.usecase';
import { GetStudentsByClassUseCase } from '../../application/queries/get-students-by-class.usecase';
import { GetClassByIdUseCase } from '../../application/queries/get-class-by-id.usecase';
import { EnrollSingleStudentDto } from './dtos/enroll-single-student.dto';
import { EnrollSingleStudentUseCase } from '../../application/commands/enroll-single-student.usecase';
import { EnrollGroupStudentUseCase } from '../../application/commands/enroll-group-students.usecase';
import { EnrollGroupStudentDTO } from './dtos/enroll-group-student.dto';
import { UpdateClassUseCase } from '../../application/commands/update-class.usecase';
import { EditClassDTO } from './dtos/edit-class.dto';
import { SoftDeleteClassUseCase } from '../../application/commands/soft-delete-class.usecase';
import { DeleteClassDTO } from './dtos/delete-class.dto';
import { DeleteStudentDTO } from './dtos/delete-student.dto';
import { GetTeacherInfoByIDUseCase } from '../../application/queries/get-teacher-info-by-id.usecase';
import { CreateCourseUseCase } from '../../application/commands/create-course.usecase';
import { CreateCourseDTO } from './dtos/create-course.dto';
import { GetCoursesByTeacherUseCase } from '../../application/queries/get-courses-by-teacher.usecase';
import { GetClassesByCourseUseCase } from '../../application/queries/get-classes-by-course.usecase';
import { getDateAbsencesBystudentUseCase } from '../../application/queries/get-date-absences-by-student.usecase.ts';
import { GetCourseByIdUseCase } from '../../application/queries/get-course-by-id.usecase';
import { SoftDeleteSingleEnrollmentUseCase } from '../../application/commands/soft-delete-single-enrollment.useCase';
import { AttendenceGroupStudentDTO } from './dtos/attendence-group-student.dto';
import { SaveAttendanceGroupStudentUseCase } from '../../application/commands/save-attendance-group-student-usecase';
import { AbsencesByClassDTO } from './dtos/absences-by-class.dto';
import { GetAbsencesByClass } from '../../application/queries/get-absences-by-class';

const academicRoute = 'academic';

@UseGuards(JwtAuthGuard)
@Controller(academicRoute)
export class AcademicManagementController {
  constructor(
    private readonly listClasses: ListClassesUseCase,
    private readonly listStudents: ListStudentsUseCase,
    private readonly getCourseById: GetCourseByIdUseCase,
    private readonly getCoursesByTeacher: GetCoursesByTeacherUseCase,
    private readonly getClassesByCourse: GetClassesByCourseUseCase,
    private readonly getClassById: GetClassByIdUseCase,
    private readonly getClassesByStudent: GetClassesByStudentUseCase,
    private readonly getStudentsByClass: GetStudentsByClassUseCase,
    private readonly getTeacherInfoById: GetTeacherInfoByIDUseCase,
    private readonly createCourse: CreateCourseUseCase,
    private readonly createClasses: CreateClassUseCase,
    private readonly enrollSingle: EnrollSingleStudentUseCase,
    private readonly enrollGroup: EnrollGroupStudentUseCase,
    private readonly updateClass: UpdateClassUseCase,
    private readonly softDeleteClass: SoftDeleteClassUseCase,
    private readonly softDeleteStudent: SoftDeleteSingleEnrollmentUseCase,
    private readonly saveAttendanceGroupStudent: SaveAttendanceGroupStudentUseCase,
    private readonly getAbsencesByClass: GetAbsencesByClass,
    private readonly getDateAbsencesBystudentUseCase: getDateAbsencesBystudentUseCase,
  ) {}

  // ---- GET ----
  @Get('classes')
  async listClassesEndPoint(@Req() req) {
    const path = getFullPath(req);
    const data = await this.listClasses.execute();
    return responseSuccess('Clases listadas correctamente', data, 'List all active classes', path);
  }

  @Get('students')
  async listStudentsEndPoint(@Req() req) {
    const path = getFullPath(req);
    const data = await this.listStudents.execute();
    return responseSuccess('Estudiantes listados correctamente', data, 'List all students', path);
  }

  @Get('course/:id')
  async getCourseByIdEndpoint(@Param('id') id: string, @Req() req) {
    const path = getFullPath(req);
    const data = await this.getCourseById.execute(id);
    return responseSuccess('Curso obtenido correctamente', data, 'Get course by ID', path);
  }

  @Get('course/by-teacher/:id')
  async getCourseByTeacherEndpoint(@Param('id') id: string, @Req() req) {
    const path = getFullPath(req);
    const data = await this.getCoursesByTeacher.execute(id);
    return responseSuccess('Cursos del profesor obtenidos correctamente', data, 'List courses by teacher', path);
  }

  @Get('classes/by-course/:id')
  async getClassesByCourseEndpoint(@Param('id') id: string, @Req() req) {
    const path = getFullPath(req);
    const data = await this.getClassesByCourse.execute(id);
    return responseSuccess('Clases listadas por curso', data, 'List classes by course ID', path);
  }

  @Get('classes/:id')
  async getClassByIdEndpoint(@Param('id') id: string, @Req() req) {
    const path = getFullPath(req);
    const data = await this.getClassById.execute(id);
    return responseSuccess('Clase obtenida correctamente', data, 'Get class by ID', path);
  }

  @Get('classes/by-student/:studentId')
  async getClassesByStudentEndpoint(@Param('studentId') studentId: string, @Req() req) {
    const path = getFullPath(req);
    const data = await this.getClassesByStudent.execute(studentId);
    return responseSuccess('Clases por estudiante obtenidas', data, 'Get classes by student ID', path);
  }

  @Get('students/by-class/:classId')
  async getStudentsByClassEndpoint(@Param('classId') classId: string, @Req() req) {
    const path = getFullPath(req);
    const data = await this.getStudentsByClass.execute(classId);
    return responseSuccess('Estudiantes listados por clase', data, 'Get students by class ID', path);
  }

  @Get('teacher/:id')
  async getTeacherInfoByID(@Param('id') id: string, @Req() req) {
    const path = getFullPath(req);
    const data = await this.getTeacherInfoById.execute(id);
    return responseSuccess('Información del docente obtenida', data, 'Get teacher info by ID', path);
  }

  @Get('/absences/classes/:classId')
  async getStudentAbsencesByClassId(@Param('classId') id: string, @Query('teacherId') teacherId: string, @Req() req) {
    const path = getFullPath(req);
    const input = { classId: id, teacherId };
    const data = await this.getAbsencesByClass.execute(input);
    return responseSuccess('Inasistencias obtenidas por clase', data, 'Get absences by class', path);
  }

  @Get('/students/:studentId/absences/dates')
  async getStudentAbsencesByDate(
    @Param('studentId') id: string,
    @Query('teacherId') teacherId: string,
    @Query('classId') classId: string,
    @Req() req,
  ) {
    const path = getFullPath(req);
    const input = { studentId: id, teacherId, classId };
    const data = await this.getDateAbsencesBystudentUseCase.execute(input);
    return responseSuccess('Fechas de inasistencias obtenidas', data, 'Get absences dates by student', path);
  }

  // ---- POST ----
  @Post('course')
  async createCourseEndpoint(@Body() dto: CreateCourseDTO, @Req() req) {
    const path = getFullPath(req);
    const data = await this.createCourse.execute(dto);
    return responseCreated('Curso creado correctamente', data, 'Create course', path);
  }

  @Post('classes')
  async createClassEndpoint(@Body() dto: CreateClassDto, @Req() req) {
    const path = getFullPath(req);
    const data = await this.createClasses.execute(dto);
    return responseCreated('Clase creada correctamente', data, 'Create class', path);
  }

  @Post('enrollments/single-student')
  async enrollSingleStudentEndpoint(@Body() dto: EnrollSingleStudentDto, @Req() req) {
    const path = getFullPath(req);
    const data = await this.enrollSingle.execute(dto);
    return responseCreated('Estudiante inscrito correctamente', data, 'Enroll single student', path);
  }

  @Post('enrollments/group-students')
  async enrollGroupStudentEndpoint(@Body() dto: EnrollGroupStudentDTO, @Req() req) {
    const path = getFullPath(req);
    const data = await this.enrollGroup.execute(dto);
    return responseCreated('Grupo de estudiantes inscrito', data, 'Enroll group students', path);
  }

  @Post('attendance/:classId')
  async AttendeceGroupStudentsEndpoint(@Param('classId') classId: string, @Body() dto: AttendenceGroupStudentDTO, @Req() req) {
    const path = getFullPath(req);
    const data = await this.saveAttendanceGroupStudent.execute({
      classId,
      teacherId: dto.teacherId,
      date: dto.date,
      studentRows: dto.studentRows,
    });
    const desc = `Registro de asistencias para la clase ${classId}`;
    return responseCreated('Asistencias registradas correctamente', data, desc, path);
  }

  // ---- PUT ----
  @Put('classes/:id')
  async updateClassEndpoint(@Param('id') id: string, @Body() dto: EditClassDTO, @Req() req) {
    const path = getFullPath(req);
    const input = {
      teacherId: dto.teacherId,
      classId: id,
      name: dto.name,
      semester: dto.semester,
      dateBegin: dto.dateBegin,
      dateEnd: dto.dateEnd,
    };
    const data = await this.updateClass.execute(input);
    return responseCreated('Clase actualizada correctamente', data, 'Update class', path);
  }

  @Put('classes/remove/:id')
  async softDeleteEndpoint(@Param('id') id: string, @Body() dto: DeleteClassDTO, @Req() req) {
    const path = getFullPath(req);
    const input = { teacherId: dto.teacherId, classId: id };
    const data = await this.softDeleteClass.execute(input);
    return responseCreated('Clase eliminada correctamente', data, 'Soft delete class', path);
  }

  @Put('students/remove/:id')
  async softDeleteStudents(@Param('id') id: string, @Body() dto: DeleteStudentDTO, @Req() req) {
    const path = getFullPath(req);
    const input = { teacherId: dto.teacherId, studentId: dto.studentId, classId: id };
    const data = await this.softDeleteStudent.execute(input);
    return responseCreated('Estudiante eliminado correctamente', data, 'Soft delete student', path);
  }
}
