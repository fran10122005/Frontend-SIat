import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const baseStyles =
  "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

const sizeStyles = {
  xs: "px-2 py-1 text-[10px] gap-1",
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
  xl: "px-6 py-3 text-base gap-2.5",
};

const variantStyles = {
  primary:
    "bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500/50 shadow-sm shadow-brand-500/20",
  secondary:
    "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-slate-400/50 border border-slate-200 dark:border-slate-700",
  danger:
    "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500/50 shadow-sm shadow-rose-500/20",
  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500/50 shadow-sm shadow-emerald-500/20",
  warning:
    "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/50 shadow-sm shadow-amber-500/20",
  ghost:
    "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400/50",
  outline:
    "border-2 border-brand-600 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 focus:ring-brand-500/50",
};

const Button = forwardRef(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const isLoading = loading && !props.disabled;

    return (
      <button
        ref={ref}
        type={type}
        disabled={props.disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span className="truncate">{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
