import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./axios", () => ({
  __esModule: true,
  default: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

vi.mock("@simplewebauthn/browser", () => ({
  startRegistration: vi.fn(),
  startAuthentication: vi.fn(),
}));

import api from "./axios";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import {
  registerFingerprint,
  loginWithFingerprint,
  listPasskeys,
  deletePasskey,
} from "./passkey";

const mockedApi = vi.mocked(api);

describe("Módulo de acceso rápido (passkey)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registerFingerprint orquesta start -> verificación del navegador -> complete", async () => {
    const options = { challenge: "reg-challenge", rp: { name: "SIAT" } };
    const credential = { id: "cred-1", response: {} };
    mockedApi.post
      .mockResolvedValueOnce({ data: { options } })
      .mockResolvedValueOnce({ data: { message: "ok" } });
    vi.mocked(startRegistration).mockResolvedValue(credential);

    const res = await registerFingerprint("Mi laptop");

    expect(mockedApi.post).toHaveBeenNthCalledWith(
      1,
      "/auth/passkey/register/start",
      {},
    );
    expect(startRegistration).toHaveBeenCalledWith(options);
    expect(mockedApi.post).toHaveBeenNthCalledWith(
      2,
      "/auth/passkey/register/complete",
      {
        credential,
        pk_nomb: "Mi laptop",
      },
    );
    expect(res.message).toBe("ok");
  });

  it("loginWithFingerprint orquesta start -> autenticación del navegador -> complete", async () => {
    const options = { challenge: "login-challenge" };
    const credential = { id: "cred-1", response: {} };
    const session = { token: "abc", user: { usu_codi: "U1" } };
    mockedApi.post
      .mockResolvedValueOnce({ data: { options } })
      .mockResolvedValueOnce({ data: session });
    vi.mocked(startAuthentication).mockResolvedValue(credential);

    const res = await loginWithFingerprint();

    expect(mockedApi.post).toHaveBeenNthCalledWith(
      1,
      "/auth/passkey/login/start",
      {},
    );
    expect(startAuthentication).toHaveBeenCalledWith(options);
    expect(mockedApi.post).toHaveBeenNthCalledWith(
      2,
      "/auth/passkey/login/complete",
      {
        credential,
      },
    );
    expect(res.token).toBe("abc");
  });

  it("listPasskeys devuelve la lista de huellas", async () => {
    const keys = [{ pk_id: "a", pk_nomb: "Dispositivo" }];
    mockedApi.get.mockResolvedValue({ data: { data: keys } });

    const res = await listPasskeys();

    expect(mockedApi.get).toHaveBeenCalledWith("/auth/passkey");
    expect(res).toEqual(keys);
  });

  it("deletePasskey llama al endpoint con el id", async () => {
    mockedApi.delete.mockResolvedValue({ data: { message: "eliminado" } });

    await deletePasskey("pk-123");

    expect(mockedApi.delete).toHaveBeenCalledWith("/auth/passkey/pk-123");
  });
});
