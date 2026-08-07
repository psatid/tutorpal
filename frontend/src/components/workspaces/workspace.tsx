import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WorkspaceShell({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col overflow-hidden border border-border bg-card sm:rounded-xl",
				className,
			)}
		>
			{children}
		</section>
	);
}

export function WorkspaceHeader({
	title,
	description,
	countLabel,
	action,
}: {
	title: string;
	description: string;
	countLabel?: string;
	action?: ReactNode;
}) {
	return (
		<header className="flex items-start justify-between gap-4 border-b border-border px-4 py-5 sm:px-6">
			<div className="min-w-0">
				<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<h1 className="text-balance text-2xl font-extrabold tracking-tight text-foreground">
						{title}
					</h1>
					{countLabel ? (
						<span className="text-sm font-medium text-muted-foreground">
							{countLabel}
						</span>
					) : null}
				</div>
				<p className="mt-1 max-w-2xl text-pretty text-sm text-muted-foreground">
					{description}
				</p>
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</header>
	);
}

export function WorkspaceMain({ children }: { children: ReactNode }) {
	return (
		<main className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">{children}</main>
	);
}

export function WorkspaceToolbar({ children }: { children: ReactNode }) {
	return (
		<div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
			{children}
		</div>
	);
}

export function WorkspaceList({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("min-h-0 flex-1 overflow-y-auto", className)}>
			{children}
		</div>
	);
}
