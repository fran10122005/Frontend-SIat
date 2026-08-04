import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("muestra el label activo cuando active=true", () => {
    render(<StatusBadge active />);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("muestra el label inactivo cuando active=false", () => {
    render(<StatusBadge active={false} />);
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("permite labels personalizados", () => {
    render(
      <StatusBadge
        active={false}
        activeLabel="Online"
        inactiveLabel="Offline"
      />,
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });
});
