export type BaseStudent = {
  nombres: string;
  apellidos: string;
  codigo: number;
};

export interface StudentUploadProps {
  onStudentsParsed: (
    students: (BaseStudent & Record<string, any>)[],
    info?: { fileName?: string }
  ) => void;
  disabled: boolean;
}