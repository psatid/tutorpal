import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceListSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<output aria-label="Loading" className="flex flex-col gap-1">
			<span className="sr-only">Loading</span>
			{Array.from({ length: rows }).map((_, index) => (
				<div
					className="flex min-h-20 items-center gap-3 border-b border-border py-4"
					key={index}
				>
					<Skeleton className="size-10 shrink-0 rounded-full" />
					<div className="flex flex-1 flex-col gap-2">
						<Skeleton className="h-4 w-40 max-w-[60%]" />
						<Skeleton className="h-3 w-64 max-w-[80%]" />
					</div>
					<Skeleton className="hidden h-8 w-20 sm:block" />
				</div>
			))}
		</output>
	);
}

export function WorkspaceErrorState({
	title,
	description,
	onRetry,
	retryLabel = "Try again",
}: {
	title: string;
	description: string;
	onRetry: () => void;
	retryLabel?: string;
}) {
	return (
		<div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
			<h2 className="text-lg font-bold text-foreground">{title}</h2>
			<p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
				{description}
			</p>
			<Button className="mt-4" onClick={onRetry} variant="outline">
				{retryLabel}
			</Button>
		</div>
	);
}

export function WorkspaceEmptyState({
	icon,
	title,
	description,
	action,
}: {
	icon: ReactNode;
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
			<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
				{icon}
			</div>
			<h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
			<p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
				{description}
			</p>
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}
