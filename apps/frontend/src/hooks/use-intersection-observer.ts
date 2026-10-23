import { useEffect, useRef, type RefObject } from "react";

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
	enabled?: boolean;
}

export function useIntersectionObserver(
	ref: RefObject<Element | null>,
	callback: () => void,
	options: UseIntersectionObserverOptions = {},
) {
	const { enabled = true, ...observerOptions } = options;
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		if (!enabled || !ref.current) {
			return;
		}

		observerRef.current = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry?.isIntersecting) {
					callback();
				}
			},
			{
				rootMargin: "200px", // Start loading 200px before reaching bottom
				threshold: 0.1,
				...observerOptions,
			},
		);

		observerRef.current.observe(ref.current);

		return () => {
			observerRef.current?.disconnect();
		};
	}, [ref, callback, enabled, observerOptions]);
}
