"use client";

import type { ButtonHTMLAttributes, ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "subtle";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	children: ReactNode;
};

const baseClasses =
	"inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-[var(--accent)] text-slate-950 hover:brightness-95 active:brightness-90",
	ghost:
		"bg-transparent text-[var(--text)] hover:bg-white/10 active:bg-white/15 border border-transparent",
	subtle:
		"bg-[var(--panel-2)] text-[var(--text)] border border-[color:var(--border)] hover:bg-white/10 active:bg-white/15",
};

function ButtonImpl(
	{ variant = "primary", className = "", children, ...props }: ButtonProps,
	ref: ForwardedRef<HTMLButtonElement>
) {
	const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
	return (
		<button ref={ref} className={classes} {...props}>
			{children}
		</button>
	);
}

export const Button = forwardRef(ButtonImpl);
export default Button;


