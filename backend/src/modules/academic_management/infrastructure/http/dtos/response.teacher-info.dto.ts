/**
 * Response DTO representing teacher profile information.
 */
export class TeacherInfoDTO {
  /**
   * Unique identifier of the teacher.
   */
  public readonly userId: string;

  /**
   * First name of the teacher.
   */
  public name: string;

  /**
   * Last name of the teacher.
   */
  public lastname: string;

  /**
   * Email address of the teacher.
   */
  public email: string;

  /**
   * Whether the teacher is currently active.
   */
  public isActive: boolean;

  /**
   * Optional academic unit (e.g., department).
   */
  public academicUnit?: string;

  /**
   * Optional academic title (e.g., Professor, Dr.).
   */
  public title?: string;

  /**
   * Optional biography or description.
   */
  public bio?: string;

  constructor(
    userId: string,
    name: string,
    lastname: string,
    email: string,
    isActive: boolean,
    academicUnit?: string,
    title?: string,
    bio?: string
  ) {
    this.userId = userId;
    this.name = name;
    this.lastname = lastname;
    this.email = email;
    this.isActive = isActive;
    this.academicUnit = academicUnit;
    this.title = title;
    this.bio = bio;
  }
}
