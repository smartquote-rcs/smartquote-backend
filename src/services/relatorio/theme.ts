export const theme = {
	// Paleta corporativa minimalista
	header: {
		bg: '#0f172a', // navy-900 discreto
		stroke: '#0f172a',
		title: '#ffffff',
	},
	trace: {
		barBg: '#ffffff',
		barStroke: '#e5e7eb',
		barText: '#6b7280',
		summaryHeaderBg: '#ffffff',
		summaryHeaderStroke: '#e5e7eb',
		summaryHeaderText: '#111827',
		bodyBg: '#ffffff',
		bodyStroke: '#e5e7eb',
		bodyText: '#111827',
	},
	card: {
		neutralBg: '#ffffff',
		neutralStroke: '#e5e7eb',
		infoStroke: '#d1d5db',
	},
	info: {
		main: '#0f3d91', // azul corporativo discreto
		alt: '#1e5bb8',
		link: '#0f3d91',
	},
	text: {
		primary: '#111827',
		muted: '#6b7280',
		lightHeading: '#ffffff',
		auditTitle: '#0f3d91',
		auditBody: '#111827',
		labelDark: '#111827',
		labelMuted: '#374151',
	},
	success: {
		main: '#16a34a',
		bg: '#f0fdf4',
		stroke: '#16a34a',
	},
	warning: {
		main: '#d97706',
		bg: '#fffbeb',
		stroke: '#d97706',
		text: '#92400e',
	},
	error: {
		main: '#dc2626',
		bg: '#fef2f2',
		stroke: '#dc2626',
	},
	audit: {
		bg: '#f9fafb',
		stroke: '#e5e7eb',
	},
	choice: {
		bg: '#f0fdf4',
		stroke: '#16a34a',
		tagBg: '#16a34a',
		tagText: '#ffffff',
		title: '#111827',
		text: '#111827',
	},
	price: {
		main: '#0f3d91',
	},
	medals: {
		// Mantém harmonia visual, mas com variações discretas do azul corporativo
		colors: ['#0f3d91', '#1e5bb8', '#3b82f6', '#60a5fa', '#93c5fd'],
		fallback: '#9ca3af',
	},
};

export type Theme = typeof theme;
