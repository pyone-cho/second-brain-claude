import type { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

const VALID_STATUSES = ['todo', 'process', 'memo'] as const;
const VALID_TYPES = [
  'task',
  'task-it-infra',
  'reading-book',
  'reading-website',
  'buying',
  'trip',
] as const;
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
const VALID_INFRA_TYPES = ['server', 'network', 'cloud'] as const;
const VALID_SOURCE_TYPES = ['book', 'website'] as const;

export type ItemStatus = (typeof VALID_STATUSES)[number];
export type ItemType = (typeof VALID_TYPES)[number];
export type Priority = (typeof VALID_PRIORITIES)[number];
export type InfraType = (typeof VALID_INFRA_TYPES)[number];

/**
 * Validate that a required string parameter exists and is not empty.
 */
export function requireParam(
  req: Request,
  param: string,
  source: 'body' | 'query' | 'params' = 'body',
): string {
  const value = req[source]?.[param];
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    throw new AppError(400, `Missing required parameter: ${param}`);
  }
  return String(value).trim();
}

/**
 * Validate and coerce a numeric ID from route params.
 */
export function requireId(req: Request, paramName: string = 'id'): number {
  const raw = req.params[paramName];
  if (!raw) {
    throw new AppError(400, `Missing required parameter: ${paramName}`);
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, `Invalid ID: ${raw}`);
  }
  return id;
}

/**
 * Validate that a string value is a valid item status.
 */
export function validateStatus(value: unknown): ItemStatus {
  if (typeof value !== 'string' || !VALID_STATUSES.includes(value as ItemStatus)) {
    throw new AppError(400, `Invalid status: ${value}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  return value as ItemStatus;
}

/**
 * Validate that a string value is a valid item type.
 */
export function validateType(value: unknown): ItemType {
  if (typeof value !== 'string' || !VALID_TYPES.includes(value as ItemType)) {
    throw new AppError(400, `Invalid type: ${value}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  return value as ItemType;
}

/**
 * Validate that a string value is a valid priority, or null/undefined.
 */
export function validatePriority(value: unknown): Priority | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !VALID_PRIORITIES.includes(value as Priority)) {
    throw new AppError(400, `Invalid priority: ${value}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  return value as Priority;
}

/**
 * Validate that a string value is a valid infra type, or null/undefined.
 */
export function validateInfraType(value: unknown): InfraType | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !VALID_INFRA_TYPES.includes(value as InfraType)) {
    throw new AppError(400, `Invalid infra type: ${value}. Must be one of: ${VALID_INFRA_TYPES.join(', ')}`);
  }
  return value as InfraType;
}

/**
 * Validate that a string value is a valid source_type for readings.
 */
export function validateSourceType(value: unknown): 'book' | 'website' | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !VALID_SOURCE_TYPES.includes(value as 'book' | 'website')) {
    throw new AppError(400, `Invalid source_type: ${value}. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  }
  return value as 'book' | 'website';
}

/**
 * Middleware factory: validates that req.params.id is a valid integer.
 * For routes that use numeric IDs (categories).
 */
export function validateCategoryId(req: Request, _res: Response, next: NextFunction): void {
  try {
    requireId(req, 'id');
    next();
  } catch (err) {
    next(err);
  }
}

export { VALID_STATUSES, VALID_TYPES, VALID_PRIORITIES, VALID_INFRA_TYPES };
