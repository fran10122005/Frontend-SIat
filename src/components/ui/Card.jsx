import { forwardRef } from "react";

const Card = forwardRef(
  (
    { padded = false, hover = true, className = "", children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 ${hover ? "hover:shadow-md" : ""} ${padded ? "p-4 sm:p-6" : ""} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

export function CardHeader({
  icon: Icon,
  title,
  subtitle,
  meta,
  actions,
  tone = "slate",
}) {
  const tones = {
    slate: "text-slate-400",
    rose: "text-rose-500",
    emerald: "text-emerald-500",
  };
  return (
    <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
      {Icon && <Icon className={`w-4 h-4 shrink-0 ${tones[tone]}`} />}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 dark:text-white truncate text-sm sm:text-base">
          {title}
        </h3>
        {(subtitle || meta) && (
          <p
            title={
              [subtitle, typeof meta === "string" ? meta : null]
                .filter(Boolean)
                .join(" · ") || undefined
            }
            className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1 flex items-center gap-1.5"
          >
            <span className="truncate">{subtitle}</span>
            {subtitle && meta && (
              <span className="text-slate-300 dark:text-slate-600">·</span>
            )}
            {meta && <span className="shrink-0 font-semibold">{meta}</span>}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function CardBody({ className = "", children }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ className = "", children }) {
  return (
    <div
      className={`px-4 sm:px-6 py-2.5 border-t border-slate-100 dark:border-slate-700 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [padding-bottom:max(0.625rem,env(safe-area-inset-bottom))] sm:[padding-bottom:0.625rem] ${className}`}
    >
      {children}
    </div>
  );
}

Card.displayName = "Card";
export default Card;
