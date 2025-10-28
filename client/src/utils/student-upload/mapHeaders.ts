import { normalize } from './normalize';

export const headerAliases = {
  nombres: ['nombre', 'nombres'],
  apellidos: ['apellido', 'apellidos'],
  codigo: ['codigo', 'código', 'cod', 'code'],
  correo: ['correo', 'email', 'mail', 'e-mail'],
  career: ['carrera', 'career'],
  campus: ['campus'],
  admissionYear: ['admissionyear', 'año de admisión', 'año', 'anio'],
  residence: ['residencia', 'residence'],
};

const pick = (normRow: Record<string, any>, aliases: string[]) => {
  for (const a of aliases) {
    const v = normRow[a];
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return '';
};

export const mapRow = (row: Record<string, any>) => {
  const normRow: Record<string, any> = {};
  for (const k of Object.keys(row)) {
    normRow[normalize(k)] = row[k];
  }

  const nombres = String(pick(normRow, headerAliases.nombres));
  const apellidos = String(pick(normRow, headerAliases.apellidos));

  const codigoValue = pick(normRow, headerAliases.codigo);
  const codigo = Number(String(codigoValue).replace(/[^\d]/g, '') || 0);

  const correo = String(pick(normRow, headerAliases.correo) || '').trim();

  const career = String(pick(normRow, headerAliases.career) || '').trim();
  const campus = String(pick(normRow, headerAliases.campus) || '').trim();

  const admissionYearRaw = String(pick(normRow, headerAliases.admissionYear) || '').trim();
  const admissionYear = admissionYearRaw
    ? Number(admissionYearRaw.replace(/[^\d]/g, ''))
    : undefined;

  const residence = String(pick(normRow, headerAliases.residence) || '').trim();

  const extras: Record<string, any> = {};
  for (const originalKey of Object.keys(row)) {
    const nk = normalize(originalKey);
    const isCore =
      headerAliases.nombres.includes(nk) ||
      headerAliases.apellidos.includes(nk) ||
      headerAliases.codigo.includes(nk) ||
      headerAliases.correo.includes(nk) ||
      headerAliases.career.includes?.(nk) ||
      headerAliases.campus.includes?.(nk) ||
      headerAliases.admissionYear.includes?.(nk) ||
      headerAliases.residence.includes?.(nk);

    if (isCore) continue;
    if (nk.startsWith('_empty')) continue;

    const val = row[originalKey];
    if (val === null || val === undefined) continue;
    if (String(val).trim() === '') continue;

    extras[originalKey] = val;
  }

  return {
    nombres,
    apellidos,
    codigo,
    ...(correo ? { correo } : {}),
    ...(career ? { career } : {}),
    ...(campus ? { campus } : {}),
    ...(admissionYear ? { admissionYear } : {}),
    ...(residence ? { residence } : {}),
    ...extras,
  };
};