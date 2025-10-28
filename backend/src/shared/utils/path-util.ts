import { Request } from 'express';

export function getFullPath(req: Request): string {
  const baseUrl = req.baseUrl || '';
  const routePath = req.route?.path || '';
  return `${baseUrl}${routePath}`;
}
