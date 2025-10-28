import { describe, test, expect } from "@jest/globals";
import ReactDOM from "react-dom";

import PeriodForm from "../components/PeriodForm";
import type { Course } from "../interfaces/courseInterface";
import type { Clase, CreateClassDTO } from "../interfaces/claseInterface";

describe("PeriodForm - render superficial", () => {
  const baseCourse: Course = {
    id: 1,
    name: "Cálculo I",
    teacherId: 10,
  } as unknown as Course;

  const noopSubmit = (_: Clase | CreateClassDTO) => Promise.resolve();

  test("renderiza labels principales y botones", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    ReactDOM.render(
      <PeriodForm
        open={true}
        onClose={() => {}}
        onSubmit={noopSubmit}
        course={baseCourse}
        loading={false}
      />,
      container
    );

    const text = container.textContent || "";
    expect(text).toMatch(/Período/i);
    expect(text).toMatch(/Semestre/);
    expect(text).toMatch(/Fecha de inicio/);
    expect(text).toMatch(/Fecha de fin/);

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    const btnTexts = Array.from(buttons).map((b) => b.textContent || "");
    expect(btnTexts.join(" ")).toMatch(/Cancelar/);
    expect(btnTexts.join(" ")).toMatch(/Crear Período|Actualizar Período/);

    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });
});
