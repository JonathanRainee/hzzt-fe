/**
 * API base URL, read from the environment (VITE_API_BASE_URL).
 * Defaults to the Vite dev proxy path so requests stay same-origin.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api/v1'
