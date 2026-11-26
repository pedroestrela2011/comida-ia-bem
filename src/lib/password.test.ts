import { describe, expect, it } from "vitest";
import { checkPassword, passwordErrorMessage } from "./password";

describe("regras de senha do Coma Fácil", () => {
  it("aceita seis letras sem números, símbolos ou maiúsculas", () => {
    expect(checkPassword("abcdef")).toEqual({ valid: true, missing: [] });
  });

  it("rejeita menos de seis caracteres e senha vazia", () => {
    expect(checkPassword("abcde").valid).toBe(false);
    expect(checkPassword("").valid).toBe(false);
  });

  it("não exige letras em uma senha", () => {
    expect(checkPassword("123456").valid).toBe(true);
  });

  it("distingue senha vazada de exigência de composição", () => {
    expect(passwordErrorMessage({ code: "weak_password", reasons: ["pwned"] })).toContain("vazamentos");
    expect(passwordErrorMessage({ message: "Invalid email" })).toBeNull();
  });
});
