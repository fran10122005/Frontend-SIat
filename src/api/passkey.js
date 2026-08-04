import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import api from "./axios";

export async function beginRegister() {
  const res = await api.post("/auth/passkey/register/start");
  return res.data.options;
}

export async function finishRegister(credential, pk_nomb) {
  const res = await api.post("/auth/passkey/register/complete", {
    credential,
    pk_nomb,
  });
  return res.data;
}

export async function beginLogin() {
  const res = await api.post("/auth/passkey/login/start");
  return res.data.options;
}

export async function finishLogin(credential) {
  const res = await api.post("/auth/passkey/login/complete", { credential });
  return res.data;
}

export async function listPasskeys() {
  const res = await api.get("/auth/passkey");
  return res.data.data;
}

export async function deletePasskey(pk_id) {
  const res = await api.delete(`/auth/passkey/${pk_id}`);
  return res.data;
}

export async function registerFingerprint(pk_nomb) {
  const options = await beginRegister();
  const credential = await startRegistration(options);
  return finishRegister(credential, pk_nomb);
}

export async function loginWithFingerprint() {
  const options = await beginLogin();
  const credential = await startAuthentication(options);
  return finishLogin(credential);
}
