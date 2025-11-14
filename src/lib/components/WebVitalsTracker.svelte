<script lang="ts">
	/**
	 * Web Vitals Tracker Component
	 * Phase 8: Automatically track Core Web Vitals and send to server
	 */

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	// Batch web vitals before sending to reduce requests
	let vitalsBatch: any[] = [];
	let batchTimer: ReturnType<typeof setTimeout> | null = null;

	const BATCH_INTERVAL = 5000; // Send batch every 5 seconds
	const MAX_BATCH_SIZE = 10; // Or when we hit 10 vitals

	/**
	 * Send vitals batch to server
	 */
	async function sendVitalsBatch() {
		if (vitalsBatch.length === 0) return;

		const batch = [...vitalsBatch];
		vitalsBatch = [];

		try {
			await fetch('/api/performance/web-vitals', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ vitals: batch }),
				// Use keepalive to ensure request completes even if page unloads
				keepalive: true
			});
		} catch (error) {
			console.error('[WebVitals] Failed to send vitals:', error);
		}
	}

	/**
	 * Queue a vital to be sent
	 */
	function queueVital(vital: any) {
		vitalsBatch.push(vital);

		// Send immediately if batch is full
		if (vitalsBatch.length >= MAX_BATCH_SIZE) {
			if (batchTimer) {
				clearTimeout(batchTimer);
				batchTimer = null;
			}
			sendVitalsBatch();
		} else if (!batchTimer) {
			// Otherwise set timer to send batch
			batchTimer = setTimeout(() => {
				sendVitalsBatch();
				batchTimer = null;
			}, BATCH_INTERVAL);
		}
	}

	/**
	 * Get device type based on screen width
	 */
	function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
		const width = window.innerWidth;
		if (width < 768) return 'mobile';
		if (width < 1024) return 'tablet';
		return 'desktop';
	}

	/**
	 * Get connection type if available
	 */
	function getConnectionType(): string | undefined {
		const nav = navigator as any;
		return nav?.connection?.effectiveType || nav?.mozConnection?.effectiveType;
	}

	/**
	 * Track a web vital metric
	 */
	function trackVital(
		metricName: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP',
		metricValue: number
	) {
		queueVital({
			metricName,
			metricValue,
			pagePath: $page.url.pathname,
			userAgent: navigator.userAgent,
			connectionType: getConnectionType(),
			deviceType: getDeviceType()
		});
	}

	onMount(() => {
		if (!browser) return;

		// Dynamic import of web-vitals library (if installed)
		// For now, we'll use Performance Observer API directly

		// Track Largest Contentful Paint (LCP)
		try {
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1] as any;
				trackVital('LCP', lastEntry.renderTime || lastEntry.loadTime);
			});
			lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
		} catch (e) {
			console.warn('[WebVitals] LCP not supported');
		}

		// Track First Input Delay (FID)
		try {
			const fidObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry: any) => {
					trackVital('FID', entry.processingStart - entry.startTime);
				});
			});
			fidObserver.observe({ type: 'first-input', buffered: true });
		} catch (e) {
			console.warn('[WebVitals] FID not supported');
		}

		// Track Cumulative Layout Shift (CLS)
		try {
			let clsValue = 0;
			const clsObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry: any) => {
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
					}
				});
			});
			clsObserver.observe({ type: 'layout-shift', buffered: true });

			// Send CLS on page unload
			window.addEventListener('beforeunload', () => {
				if (clsValue > 0) {
					trackVital('CLS', clsValue);
					sendVitalsBatch(); // Force send immediately
				}
			});
		} catch (e) {
			console.warn('[WebVitals] CLS not supported');
		}

		// Track First Contentful Paint (FCP)
		try {
			const fcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					trackVital('FCP', entry.startTime);
				});
			});
			fcpObserver.observe({ type: 'paint', buffered: true });
		} catch (e) {
			console.warn('[WebVitals] FCP not supported');
		}

		// Track Time to First Byte (TTFB)
		try {
			const navigationEntry = performance.getEntriesByType(
				'navigation'
			)[0] as PerformanceNavigationTiming;
			if (navigationEntry) {
				const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
				trackVital('TTFB', ttfb);
			}
		} catch (e) {
			console.warn('[WebVitals] TTFB not supported');
		}

		// Track Interaction to Next Paint (INP) - newer metric
		try {
			const inpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry: any) => {
					trackVital('INP', entry.duration);
				});
			});
			inpObserver.observe({ type: 'event', buffered: true });
		} catch (e) {
			// INP is a newer metric, might not be supported everywhere
		}

		// Send any remaining vitals before page unload
		window.addEventListener('beforeunload', () => {
			sendVitalsBatch();
		});

		// Cleanup function
		return () => {
			if (batchTimer) {
				clearTimeout(batchTimer);
			}
			sendVitalsBatch();
		};
	});
</script>

<!-- This component has no visual output -->
