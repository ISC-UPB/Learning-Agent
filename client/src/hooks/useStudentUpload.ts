import { Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import * as XLSX from 'xlsx';
import { MAX_ROWS, MAX_SIZE, ALLOWED_EXT } from '../constants/student-upload.constants';
import { mapRow } from '../utils/student-upload/mapHeaders';

type BaseStudent = {
  nombres: string;
  apellidos: string;
  codigo: number;
};

interface HookProps {
  onStudentsParsed: (
    students: (BaseStudent & Record<string, any>)[],
    info?: { fileName?: string }
  ) => void;
}

export const useStudentUpload = ({ onStudentsParsed }: HookProps) => {
  const parseWorkbook = (workbook: XLSX.WorkBook, fileName: string) => {
    if (!workbook.SheetNames?.length) {
      message.error('No se pudo leer el archivo.');
      return;
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (!rows.length) {
      message.error('El archivo no contiene filas para procesar.');
      return;
    }
    if (rows.length > MAX_ROWS) {
      message.error('El archivo no puede contener más de 100 filas');
      return Upload.LIST_IGNORE;
    }

    const parsed = rows.map(mapRow);

    const missingCore = parsed.some((r) => !r.nombres || !r.apellidos || !r.codigo);
    if (missingCore) {
      message.error('Faltan columnas obligatorias: Nombre(s), Apellido(s) y Código.');
      return Upload.LIST_IGNORE;
    }

    const seen = new Set<number>();
    const unique = parsed.filter((r) => {
      if (!r.codigo) return false;
      if (seen.has(r.codigo)) return false;
      seen.add(r.codigo);
      return true;
    });

    onStudentsParsed(unique as any, { fileName });
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (file.size > MAX_SIZE) {
      message.error('El archivo no puede superar 1MB');
      return Upload.LIST_IGNORE;
    }

    const isCsv = /\.csv$/i.test(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (isCsv) {
          const text = String(e.target?.result || '');
          let wb = XLSX.read(text, { type: 'string' });

          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const cols = firstSheet
            ? (XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0] as string[])
            : [];
          const allOneCell = cols && cols.length === 1;

          if (allOneCell && text.includes(';')) {
            wb = XLSX.read(text, { type: 'string', FS: ';' });
          }

          parseWorkbook(wb, file.name);
        } else {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array' });
          parseWorkbook(wb, file.name);
        }
      } catch {
        message.error('No se pudo procesar el archivo. Verifica el formato.');
      }
    };

    if (isCsv) {
      reader.readAsText(file, 'utf-8');
    } else {
      reader.readAsArrayBuffer(file);
    }

    return Upload.LIST_IGNORE;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: ALLOWED_EXT,
    showUploadList: false,
    beforeUpload,
  };

  return { uploadProps };
};