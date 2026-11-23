import { describe, expect, it } from "vitest";
import { checkPassword } from "./password";

describe("regras de senha do Coma Fácil", () => {
  it("aceita automaticamente uma senha com 8 caracteres, número e caractere especial, sem maiúscula", () => {
    expect(checkPassword("comafacil1!")).toEqual({ valid: true, missing: [] });
  });

  it("rejeita uma senha com menos de 8 caracteres", () => {
    expect(checkPassword("cofa1!")).toMatchObject({ valid: false });
    expect(checkPassword("cofa1!").missing).toContain("Pelo menos 8 caracteres");
  });

  it("rejeita uma senha sem número", () => {
    expect(checkPassword("comafacil!")).toMatchObject({ valid: false });
    expect(checkPassword("comafacil!").missing).toContain("Pelo menos 1 número");
  });

  it("rejeita uma senha sem caractere especial", () => {
    expect(checkPassword("comafacil1")).toMatchObject({ valid: false });
    expect(checkPassword("comafacil1").missing).toContain("Pelo menos 1 caractere especial");
  });
});
