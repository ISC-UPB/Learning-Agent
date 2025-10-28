/**
 * Response DTO representing student user profile information.
 */
export class UserInfoDTO {
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
   * Email address of the student.
   */
  public email: string;

  /**
   * Whether the student account is active.
   */
  public isActive: boolean;

  /**
   * Optional career name.
   */
  public career?: string;

  /**
   * Optional year of admission.
   */
  public admissionYear?: number;

  constructor(
    userId: string,
    code: string,
    name: string,
    lastname: string,
    email: string,
    isActive: boolean,
    career?: string,
    admissionYear?: number,
  ) {
    this.userId = userId;
    this.code = code;
    this.name = name;
    this.lastname = lastname;
    this.email = email;
    this.isActive = isActive;
    this.career = career;
    this.admissionYear = admissionYear;
  }
}
