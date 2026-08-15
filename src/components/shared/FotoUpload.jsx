import { useState, useRef } from "react";
import { UploadCloud, Camera, AlertCircle } from "lucide-react";
import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "../../config/cloudinary";

export default function FotoUpload({
  value,
  onChange,
  folder = FOLDERS.patientPhotos,
  label = "Foto de Perfil",
  alt = "Foto",
  size = "w-20 h-20",
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
      setError("La foto no puede superar los 5 MB.");
      return;
    }
    if (!isCloudinaryReady()) {
      setError("Cloudinary no está configurado.");
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
      setError("No se pudo subir la foto. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative ${size} rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 shrink-0
          ${uploading ? "cursor-wait" : "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"}`}
      >
        {value ? (
          <>
            <img src={value} alt={alt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400 dark:text-slate-500 gap-0.5">
            <UploadCloud className="w-6 h-6" />
            <span className="text-[9px] font-semibold">Foto</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-xs font-bold">{progress}%</span>
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
      <div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </p>
        <p className="text-[11px] text-slate-400">
          JPG, PNG o WebP · Máx. 5 MB
        </p>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold mt-1"
          >
            Quitar foto
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
