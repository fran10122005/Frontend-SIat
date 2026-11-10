import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EspecialistasTab from "./EspecialistasTab";
import { getAdultOrYouthDateBounds } from "../../utils/validators";

const baseProps = {
  especialistas: [
    {
      esp_codi: "E100",
      esp_tdoc: "V",
      esp_cedu: "18223344",
      esp_nomb: "Elena",
      esp_apel: "Mendoza",
      esp_gner: "F",
      esp_telf: "+584121234567",
      esp_licencia: "MPPS-4455",
      tm_especi: { esc_codi: "ESC1", esc_nomb: "Terapia Ocupacional" },
      tm_usuar: { usu_crro: "elena@siat.org", usu_estd: true },
      _count: { tc_asign: 2 },
    },
  ],
  catalogos: {
    especialidades: [
      { esc_codi: "ESC1", esc_nomb: "Terapia Ocupacional", esc_estd: true },
    ],
  },
  newEsp: {
    esp_cedu: "",
    esp_nomb: "",
    esp_apel: "",
    usu_crro: "",
    usu_clve: "",
    esp_licencia: "",
    esp_telf: "",
    esc_codi: "ESC1",
    esp_gner: "M",
    esp_tdoc: "V",
    esp_fnac: "1990-05-10",
    esp_foto: "",
  },
  setNewEsp: vi.fn(),
  editingEsp: null,
  setEditingEsp: vi.fn(),
  loading: false,
  handleCreateEspecialista: vi.fn(),
  handleUpdateEsp: vi.fn(),
  handleToggleActivo: vi.fn(),
  handleResetPassword: vi.fn(),
  exportEspecialistasToPDF: vi.fn(),
  exportEspecialistasToExcel: vi.fn(),
  newEspCat: { esc_codi: "", esc_nomb: "", esc_desc: "" },
  setNewEspCat: vi.fn(),
  editingEspCat: null,
  setEditingEspCat: vi.fn(),
  handleCreateEspecialidad: vi.fn(),
  handleUpdateEspecialidad: vi.fn(),
  handleToggleEspecialidad: vi.fn(),
};

describe("EspecialistasTab - Cédula separada de Código Interno e íconos de exportación", () => {
  it("usa los íconos personalizados de PDF y Excel en los botones de exportación", () => {
    render(<EspecialistasTab {...baseProps} />);

    const pdfImg = screen.getByAltText("PDF");
    const excelImg = screen.getByAltText("Excel");

    expect(pdfImg).toBeInTheDocument();
    expect(excelImg).toBeInTheDocument();
  });

  it("muestra la cédula real del especialista separada de su código interno en la ficha", () => {
    render(<EspecialistasTab {...baseProps} />);

    fireEvent.click(screen.getByText(/Dra\. Elena Mendoza/i));

    expect(screen.getByText("Cédula / Documento")).toBeInTheDocument();
    expect(screen.getByText("V-18223344")).toBeInTheDocument();
    expect(screen.getByText(/Cód\. Interno:\s*E100/i)).toBeInTheDocument();
  });

  it("en el formulario de creación enlaza el campo Cédula a esp_cedu y no a esp_codi", () => {
    const setNewEsp = vi.fn();
    render(<EspecialistasTab {...baseProps} setNewEsp={setNewEsp} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Nuevo Especialista/i }),
    );

    const cedulaInput = screen.getByPlaceholderText("Ej. 12345678");
    fireEvent.change(cedulaInput, { target: { value: "20445566" } });

    expect(setNewEsp).toHaveBeenCalledWith(
      expect.objectContaining({ esp_cedu: "20445566" }),
    );
  });

  it("sanitiza 'ik' en cédula V, permite alfanuméricos en Pasaporte P, normaliza teléfono VE y aplica rango 12-75 años", () => {
    const handleCreateEspecialista = vi.fn();

    function ControlledHarness() {
      const [newEsp, setNewEsp] = useState({
        ...baseProps.newEsp,
        esp_fnac: "",
      });
      return (
        <EspecialistasTab
          {...baseProps}
          newEsp={newEsp}
          setNewEsp={setNewEsp}
          handleCreateEspecialista={handleCreateEspecialista}
        />
      );
    }

    render(<ControlledHarness />);

    fireEvent.click(
      screen.getByRole("button", { name: /Nuevo Especialista/i }),
    );

    const cedulaInput = document.querySelector('input[name="esp_cedu"]');
    const tdocSelect = document.querySelector('select[name="esp_tdoc"]');
    const telInput = document.querySelector('input[name="esp_telf"]');
    const fnacInput = document.querySelector('input[name="esp_fnac"]');

    // Bloquea "ik" cuando es cédula V
    fireEvent.change(cedulaInput, { target: { value: "ik" } });
    expect(cedulaInput.value).toBe("");

    // Cambia a Pasaporte (P) y permite letras en mayúscula
    fireEvent.change(tdocSelect, { target: { value: "P" } });
    fireEvent.change(cedulaInput, { target: { value: "p123ab" } });
    expect(cedulaInput.value).toBe("P123AB");

    // Normaliza teléfono móvil VE sin espacios ni guiones
    fireEvent.change(telInput, { target: { value: "+58 412-1234567" } });
    expect(telInput.value).toBe("+584121234567");

    // Límites min y max del calendario de nacimiento (12-75 años)
    const expectedBounds = getAdultOrYouthDateBounds(12, 75);
    expect(fnacInput).toHaveAttribute("min", expectedBounds.min);
    expect(fnacInput).toHaveAttribute("max", expectedBounds.max);
  });

  it("señala errores inline y bloquea envío cuando faltan campos obligatorios", () => {
    const handleCreateEspecialista = vi.fn();
    render(
      <EspecialistasTab
        {...baseProps}
        newEsp={{
          ...baseProps.newEsp,
          esp_cedu: "",
          esp_nomb: "",
          esp_apel: "",
          usu_crro: "",
          esp_fnac: "",
        }}
        handleCreateEspecialista={handleCreateEspecialista}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Nuevo Especialista/i }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Registrar Especialista/i }),
    );

    expect(handleCreateEspecialista).not.toHaveBeenCalled();
    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeGreaterThanOrEqual(4);
    expect(
      screen.getByText(/número de documento es obligatorio/i),
    ).toBeInTheDocument();
  });
});
