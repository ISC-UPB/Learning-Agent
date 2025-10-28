import dayjs from "dayjs";

export const MIN_BUSINESS_DAYS = 25;
export const SEMESTER_REGEX = /^(PRIMERO|SEGUNDO|INVIERNO|VERANO) \d{4}$/;

export type SemesterRange = {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
  type: "NORMAL" | "SPECIAL";
};

export function buildAllPeriods(currentYear: number) {
  const allPeriods: {
    name: string;
    start: string;
    end: string;
    type: "NORMAL" | "SPECIAL";
  }[] = [];

  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    allPeriods.push(
      {
        name: `PRIMERO ${year}`,
        start: `${year}-01-01`,
        end: `${year}-06-30`,
        type: "NORMAL",
      },
      {
        name: `INVIERNO ${year}`,
        start: `${year}-06-01`,
        end: `${year}-07-31`,
        type: "SPECIAL",
      },
      {
        name: `SEGUNDO ${year}`,
        start: `${year}-07-01`,
        end: `${year}-12-31`,
        type: "NORMAL",
      },
      {
        name: `VERANO ${year}`,
        start: `${year - 1}-12-01`,
        end: `${year}-01-31`,
        type: "SPECIAL",
      }
    );
  }
  return allPeriods.sort((a, b) => dayjs(b.start).diff(dayjs(a.start)));
}