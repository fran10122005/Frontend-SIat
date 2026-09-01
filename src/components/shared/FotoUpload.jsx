import { useState, useRef } from "react";
import { Camera, AlertCircle, X } from "lucide-react";
import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "../../config/cloudinary";

export default function FotoUpload({
  value,
  onChange,
  folder = FOLDERS.patientPhotos,
  label = "Foto de perfil",
  alt = "Foto",
  size = "w-12 h-12",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten archivos de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Máx. 5 MB.");
      return;
    }
    if (!isCloudinaryReady()) {
      setError("Error de configuración.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const { url } = await uploadToCloudinary(file, "image", folder, (p) =>
        setProgress(p),
      );
      onChange(url);
    } catch {
      setError("Error al subir.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        title={label}
        className={`relative ${size} rounded-full overflow-hidden cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 transition-opacity ${uploading ? "opacity-60 cursor-wait" : ""}`}
      >
        {value ? (
          <img src={value} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <Camera className="w-5 h-5 text-slate-400" />
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Camera className="w-4 h-4 text-white" />
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-white text-[10px] font-bold">
              {progress}%
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />

      <div className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold disabled:opacity-50"
          >
            {value ? "Cambiar" : "Subir foto"}
          </button>
          {value && !uploading && (
            <>
              <span className="text-slate-300 dark:text-slate-600 text-[11px]">
                ·
              </span>
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-0.5 text-[11px] text-rose-500 hover:text-rose-600 font-medium"
              >
                <X className="w-3 h-3" /> Quitar
              </button>
            </>
          )}
        </div>
        {error && (
          <p className="text-[10px] text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {error}
          </p>
        )}
      </div>
    </div>
  );
}
