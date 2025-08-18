"use client";

import type { InputHTMLAttributes, ForwardedRef } from "react";
import { forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {};

const baseClasses =
	"w-full rounded-md border border-[color:var(--border)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--text)] placeholder-[color:var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]";

function InputImpl(
	{ className = "", ...props }: InputProps,
	ref: ForwardedRef<HTMLInputElement>
) {
	const classes = `${baseClasses} ${className}`.trim();
	return <input ref={ref} className={classes} {...props} />;
}

export const Input = forwardRef(InputImpl);
export default Input;


