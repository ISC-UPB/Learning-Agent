/**
 * Response DTO representing a student's absence summary.
 */
export class StudentAbsenceInfo {
  /**
   * Unique identifier of the user.
   */
  public readonly userId: string;

  /**
   * Student code (e.g., registration number).
   */
  public code: string;

  /**
   * First name of the student.
   */
  public name: string;

  /**
   * Last name of the student.
   */
  public lastname: string;

  /**
   * Total number of absences.
   */
  public totalAbsences: number;

  constructor(
    userId: string,
    code: string,
    name: string,
    lastname: string,
    totalAbsences: number,
  ) {
    this.userId = userId;
    this.code = code;
    this.name = name;
    this.lastname = lastname;
    this.totalAbsences = totalAbsences;
  }
}
