import { AlertCircle } from "lucide-react";

export default function FormField({
  name,
  label,
  required = false,
  error = "",
  hint = "",
  counter = null,
  labelRight = null,
  className = "",
  children,
}) {
  const errorId = name ? `${name}-error` : undefined;

  return (
    <div data-field={name} className={className}>
      {(label || labelRight || counter) && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {label ? (
            <label
              htmlFor={name}
              className="form-label form-label-inline form-label-row"
            >
              <span>{label}</span>
              {required && (
                <span
                  className="text-rose-500 font-bold ml-0.5"
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {labelRight}
            {counter && (
              <span
                className={`text-[10px] font-semibold tabular-nums ${
                  counter.current >= counter.max
                    ? "text-rose-500"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {counter.current}/{counter.max}
              </span>
            )}
          </div>
        </div>
      )}

      {children}

      {error ? (
        <p id={errorId} role="alert" className="form-error">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="form-hint">{hint}</p>
      ) : null}
    </div>
  );
}
