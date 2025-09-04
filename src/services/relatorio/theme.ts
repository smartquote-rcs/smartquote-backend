export const theme = {
	header: {
		bg: '#1e40af', // indigo-800
		stroke: '#1d4ed8', // indigo-600
		title: '#ffffff',
	},
	trace: {
		barBg: '#111827', // gray-900
		barStroke: '#374151', // gray-700
		barText: '#e5e7eb', // gray-200
		summaryHeaderBg: '#0f766e', // teal-700
		summaryHeaderStroke: '#115e59', // teal-800
		summaryHeaderText: '#ecfeff', // cyan-50
		bodyBg: '#f8f9fa', // neutral card
		bodyStroke: '#cbd5e1',
		bodyText: '#0f172a',
	},
	card: {
		neutralBg: '#f8f9fa',
		neutralStroke: '#bdc3c7',
		infoStroke: '#93c5fd',
	},
	info: {
		main: '#2563eb',
		alt: '#1d4ed8',
		link: '#2563eb',
	},
	text: {
		primary: '#2c3e50',
		muted: '#7f8c8d',
		lightHeading: '#ffffff',
		auditTitle: '#3730a3',
		auditBody: '#1f2937',
		labelDark: '#0f172a',
		labelMuted: '#334155',
	},
	success: {
		main: '#22c55e',
		bg: '#e8f5e8',
		stroke: '#22c55e',
	},
	warning: {
		main: '#f59e0b',
		bg: '#fff3cd',
		stroke: '#f59e0b',
		text: '#856404',
	},
	error: {
		main: '#e74c3c',
		bg: '#fdeaea',
		stroke: '#e74c3c',
	},
	audit: {
		bg: '#eef2ff',
		stroke: '#6366f1',
	},
	choice: {
		bg: '#e8f5e8',
		stroke: '#22c55e',
		tagBg: '#22c55e',
		tagText: '#ffffff',
		title: '#2c3e50',
		text: '#2c3e50',
	},
	price: {
		main: '#e67e22',
	},
		medals: {
			// Usado em Local e Web para manter harmonia visual
			colors: ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa'],
			fallback: '#95a5a6',
		},
};

export type Theme = typeof theme;
