import { FileText, Eye, Download } from "lucide-react";

const getDocName = (doc, idx) => {
  if (typeof doc === "object" && doc?.nombre) return doc.nombre;
  const url = typeof doc === "string" ? doc : doc?.url;
  try {
    const segments = decodeURIComponent(new URL(url).pathname.split("/"));
    const file = segments[segments.length - 1];
    return file.replace(/^[a-f0-9]{10,}_/i, "").replace(/\.[^.]+$/, "");
  } catch {
    return `Documento ${idx + 1}`;
  }
};

const getDocUrl = (doc) => (typeof doc === "string" ? doc : doc?.url);

const toDownloadUrl = (url) => {
  if (!url) return url;
  const marker = "/upload/";
  const pos = url.indexOf(marker);
  if (pos !== -1 && !url.includes("fl_attachment")) {
    return `${url.slice(0, pos + marker.length)}fl_attachment/${url.slice(pos + marker.length)}`;
  }
  return url;
};

export default function DocumentosClinicos({ docs }) {
  const list = Array.isArray(docs) ? docs.filter((d) => getDocUrl(d)) : [];

  return (
    <div className="p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors duration-200">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
        <FileText className="w-3.5 h-3.5" /> Documentos Clínicos
        <span className="ml-auto font-medium normal-case tracking-normal">
          {list.length} archivo{list.length !== 1 ? "s" : ""}
        </span>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-2">
          Sin informes adjuntos para este paciente.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((doc, i) => {
            const url = getDocUrl(doc);
            return (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <p className="flex-1 min-w-0 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {getDocName(doc, i)}
                </p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title="Ver documento"
                  className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-600 dark:text-blue-400 dark:hover:text-blue-300 shrink-0"
                >
                  <Eye className="w-4 h-4" /> Ver
                </a>
                <a
                  href={toDownloadUrl(url)}
                  title="Descargar documento"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 shrink-0"
                >
                  <Download className="w-4 h-4" /> Descargar
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
