import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
	children: ReactNode;
};

export default function Card({ className = "", children, ...props }: CardProps) {
	const classes = `rounded-lg border border-[color:var(--border)] bg-[var(--panel)] shadow-sm ${className}`.trim();
	return (
		<div className={classes} {...props}>
			{children}
		</div>
	);
}


