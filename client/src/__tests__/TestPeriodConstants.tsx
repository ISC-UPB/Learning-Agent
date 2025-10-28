import { describe, test, expect } from "@jest/globals";
import dayjs from "dayjs";
import { buildAllPeriods } from "../constants/period.constants";

describe("period.constants - buildAllPeriods", () => {
  test("genera 4 períodos por año en el rango y vienen ordenados desc por inicio", () => {
    const currentYear = dayjs().year();
    const list = buildAllPeriods(currentYear);

    expect(list.length).toBe(28);

    const firstStart = dayjs(list[0].start);
    const lastStart = dayjs(list[list.length - 1].start);
    expect(firstStart.isAfter(lastStart)).toBe(true);
  });
});