import dayjs from "dayjs";
import { computeMinEndDate, countBusinessDays } from "../hooks/usePeriodForm";
import { describe, test, expect } from "@jest/globals";

describe("usePeriodForm - lógica de días hábiles", () => {
  test("computeMinEndDate respeta mínimo para tipo NORMAL (>= 25 días hábiles)", () => {
    const start = dayjs("2025-03-03");
    const endLimit = dayjs("2025-06-30");
    const minEnd = computeMinEndDate(start, endLimit, "NORMAL");

    const days = countBusinessDays(start, minEnd);
    expect(days).toBeGreaterThanOrEqual(25);
  });

  test("computeMinEndDate usa mínimo reducido para tipo SPECIAL (>= 20 días hábiles)", () => {
    const start = dayjs("2025-06-02"); 
    const endLimit = dayjs("2025-07-31");
    const minEnd = computeMinEndDate(start, endLimit, "SPECIAL");

    const days = countBusinessDays(start, minEnd);
    expect(days).toBeGreaterThanOrEqual(20);
  });

  test("countBusinessDays ignora sábados y domingos", () => {
    const start = dayjs("2025-10-13");
    const end = dayjs("2025-10-20");
    expect(countBusinessDays(start, end)).toBe(5);
  });
});