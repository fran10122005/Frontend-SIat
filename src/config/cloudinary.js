/**
 * cloudinary.js — Configuración de Cloudinary para el cliente React (SIAT)
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  INSTRUCCIONES DE CONFIGURACIÓN (mañana cuando crees la cuenta)  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  1. Crear cuenta en https://cloudinary.com (gratis, 25 GB/mes)   ║
 * ║  2. En el Dashboard copiar el "Cloud Name" (ej. dxyz1234)        ║
 * ║  3. Ir a Settings → Upload → Add upload preset:                  ║
 * ║     • Nombre: siat_unsigned                                       ║
 * ║     • Signing Mode: Unsigned ← IMPORTANTE                        ║
 * ║     • Allowed formats: jpg, jpeg, png, webp, pdf                 ║
 * ║     • Folder: siat                                               ║
 * ║  4. Reemplazar CLOUD_NAME y UPLOAD_PRESET abajo con tus datos.   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ← CAMBIAR ESTOS DOS VALORES cuando crees tu cuenta Cloudinary
export const CLOUD_NAME = "wvhx0eok";
export const UPLOAD_PRESET = "siat_unsigned"; // Nombre del upload preset creado

export const FOLDERS = {
  patientPhotos: "siat/pacientes/fotos",
  medicalDocs: "siat/pacientes/documentos",
  specialistPhotos: "siat/especialistas/fotos",
};

/**
 * Sube un archivo directamente a Cloudinary desde el navegador.
 * No requiere backend ni API Key secreta al usar Upload Preset Unsigned.
 *
 * @param {File} file - El objeto File del input o drag-and-drop.
 * @param {'image'|'raw'} resourceType - 'image' para fotos, 'raw' para PDFs.
 * @param {string} folder - La carpeta destino dentro de Cloudinary.
 * @param {(progress: number) => void} onProgress - Callback de progreso (0–100).
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(
  file,
  resourceType = "image",
  folder = FOLDERS.patientPhotos,
  onProgress,
) {
  if (!CLOUD_NAME) {
    throw new Error(
      "Cloudinary no está configurado. Agrega el CLOUD_NAME en src/config/cloudinary.js",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType === "raw" ? "raw" : "image"}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({ url: data.secure_url, publicId: data.public_id });
      } else {
        reject(
          new Error(`Cloudinary error: ${xhr.status} — ${xhr.responseText}`),
        );
      }
    };

    xhr.onerror = () =>
      reject(new Error("Error de red al subir archivo a Cloudinary."));
    xhr.send(formData);
  });
}

/**
 * Retorna true si Cloudinary está configurado y listo para usar.
 */
export const isCloudinaryReady = () => Boolean(CLOUD_NAME);
