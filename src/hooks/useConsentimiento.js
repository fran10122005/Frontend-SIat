import { useState, useEffect } from "react";
import api from "../api/axios";
import { useGlobalContext } from "../context/GlobalState";

export function useConsentimiento(nin_codi) {
  const { userRole, showToast } = useGlobalContext();
  const [consentimientoOk, setConsentimientoOk] = useState(true);
  const [loadingConsentimiento, setLoadingConsentimiento] = useState(true);

  useEffect(() => {
    if (userRole !== "REPRESENTANTE" || !nin_codi) {
      setConsentimientoOk(true);
      setLoadingConsentimiento(false);
      return;
    }

    const checkConsentimiento = async () => {
      const cacheKey = `consentimiento_${nin_codi}`;
      if (sessionStorage.getItem(cacheKey) === "true") {
        setConsentimientoOk(true);
        setLoadingConsentimiento(false);
        return;
      }

      try {
        setLoadingConsentimiento(true);
        const res = await api.get(`/consentimiento/estado/${nin_codi}`);
        const { consentimientoOk: ok } = res.data.data;

        setConsentimientoOk(ok);
        if (ok) {
          sessionStorage.setItem(cacheKey, "true");
        }
      } catch (error) {
        console.error("Error verificando consentimiento", error);
        showToast("⚠️ No se pudo verificar el estado del consentimiento legal");
        setConsentimientoOk(true);
      } finally {
        setLoadingConsentimiento(false);
      }
    };

    checkConsentimiento();
  }, [nin_codi, userRole, showToast]);

  const aceptarConsentimiento = async (con_vers) => {
    try {
      await api.post("/consentimiento/aceptar", {
        nin_codi,
        con_vers,
      });
      setConsentimientoOk(true);
      sessionStorage.setItem(`consentimiento_${nin_codi}`, "true");
      return true;
    } catch (error) {
      console.error(error);
      showToast(
        `❌ Error al aceptar: ${error.response?.data?.error || error.message}`,
      );
      return false;
    }
  };

  return {
    consentimientoOk,
    loadingConsentimiento,
    aceptarConsentimiento,
  };
}
