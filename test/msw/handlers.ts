import type { RequestHandler } from 'msw'

// Handlers are added per feature. From F2 on they are typed from shared/api/schema.d.ts.
export const handlers: RequestHandler[] = []
