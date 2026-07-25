// SkillScan AI API Configuration
// Uses VITE_API_BASE_URL environment variable in production (e.g. on Vercel),
// falling back to http://localhost:5000 for local development.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
