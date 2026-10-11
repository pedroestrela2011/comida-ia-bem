import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GamificationDisabledNotice } from "./GamificationDisabledNotice";

const { preference } = vi.hoisted(() => ({ preference: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } } }) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: preference })) })),
    })),
  },
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("GamificationDisabledNotice", () => {
  it("shows the disabled notice and a settings link", async () => {
    preference.mockResolvedValue({ data: { gamificacao_ativa: false }, error: null });
    render(<MemoryRouter><GamificationDisabledNotice /></MemoryRouter>);
    expect(await screen.findByRole("alert")).toHaveTextContent("Jornada de Evolução desativada");
    expect(screen.getByRole("link", { name: "Ir para Configurações" })).toHaveAttribute("href", "/dashboard/configuracoes");
  });

  it("does not show the notice when enabled", async () => {
    preference.mockResolvedValue({ data: { gamificacao_ativa: true }, error: null });
    render(<MemoryRouter><GamificationDisabledNotice /></MemoryRouter>);
    await vi.waitFor(() => expect(preference).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});