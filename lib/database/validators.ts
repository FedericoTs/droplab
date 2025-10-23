/**
 * Database input validation helpers
 *
 * Provides consistent validation with clear error messages
 * and automatic logging of validation failures.
 */

import { dbLogger } from './logger';

/**
 * Custom error for validation failures
 * Includes field name and invalid value for debugging
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate that a value is not null, undefined, or empty string
 */
export function validateRequired(
  value: any,
  fieldName: string,
  operation: string
): void {
  if (value === null || value === undefined || value === '') {
    const error = new ValidationError(
      `${fieldName} is required`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName });
    throw error;
  }
}

/**
 * Validate string type and optionally min/max length
 */
export function validateString(
  value: any,
  fieldName: string,
  operation: string,
  options?: { minLength?: number; maxLength?: number }
): void {
  validateRequired(value, fieldName, operation);

  if (typeof value !== 'string') {
    const error = new ValidationError(
      `${fieldName} must be a string`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, type: typeof value });
    throw error;
  }

  if (options?.minLength && value.length < options.minLength) {
    const error = new ValidationError(
      `${fieldName} must be at least ${options.minLength} characters`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, length: value.length });
    throw error;
  }

  if (options?.maxLength && value.length > options.maxLength) {
    const error = new ValidationError(
      `${fieldName} must be at most ${options.maxLength} characters`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, length: value.length });
    throw error;
  }
}

/**
 * Validate ID format (non-empty string)
 */
export function validateId(
  value: any,
  fieldName: string,
  operation: string
): void {
  validateString(value, fieldName, operation, { minLength: 1 });
}

/**
 * Validate email format
 */
export function validateEmail(
  value: any,
  fieldName: string,
  operation: string
): void {
  validateString(value, fieldName, operation);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    const error = new ValidationError(
      `${fieldName} must be a valid email`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName });
    throw error;
  }
}

/**
 * Validate number type and optionally min/max value
 */
export function validateNumber(
  value: any,
  fieldName: string,
  operation: string,
  options?: { min?: number; max?: number; integer?: boolean }
): void {
  validateRequired(value, fieldName, operation);

  const num = Number(value);
  if (isNaN(num)) {
    const error = new ValidationError(
      `${fieldName} must be a number`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, type: typeof value });
    throw error;
  }

  if (options?.integer && !Number.isInteger(num)) {
    const error = new ValidationError(
      `${fieldName} must be an integer`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, value: num });
    throw error;
  }

  if (options?.min !== undefined && num < options.min) {
    const error = new ValidationError(
      `${fieldName} must be at least ${options.min}`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, value: num });
    throw error;
  }

  if (options?.max !== undefined && num > options.max) {
    const error = new ValidationError(
      `${fieldName} must be at most ${options.max}`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, value: num });
    throw error;
  }
}

/**
 * Validate enum value (must be one of allowed values)
 */
export function validateEnum<T>(
  value: any,
  fieldName: string,
  operation: string,
  allowedValues: readonly T[]
): void {
  validateRequired(value, fieldName, operation);

  if (!allowedValues.includes(value as T)) {
    const error = new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, {
      field: fieldName,
      allowedValues: allowedValues as any[],
      received: value,
    });
    throw error;
  }
}

/**
 * Validate boolean type
 */
export function validateBoolean(
  value: any,
  fieldName: string,
  operation: string
): void {
  validateRequired(value, fieldName, operation);

  if (typeof value !== 'boolean') {
    const error = new ValidationError(
      `${fieldName} must be a boolean`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, type: typeof value });
    throw error;
  }
}

/**
 * Validate ISO 8601 date string
 */
export function validateISODate(
  value: any,
  fieldName: string,
  operation: string
): void {
  validateString(value, fieldName, operation);

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    const error = new ValidationError(
      `${fieldName} must be a valid ISO 8601 date`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName });
    throw error;
  }
}

/**
 * Validate array type and optionally min/max length
 */
export function validateArray(
  value: any,
  fieldName: string,
  operation: string,
  options?: { minLength?: number; maxLength?: number }
): void {
  validateRequired(value, fieldName, operation);

  if (!Array.isArray(value)) {
    const error = new ValidationError(
      `${fieldName} must be an array`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, type: typeof value });
    throw error;
  }

  if (options?.minLength && value.length < options.minLength) {
    const error = new ValidationError(
      `${fieldName} must have at least ${options.minLength} items`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, length: value.length });
    throw error;
  }

  if (options?.maxLength && value.length > options.maxLength) {
    const error = new ValidationError(
      `${fieldName} must have at most ${options.maxLength} items`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, length: value.length });
    throw error;
  }
}

/**
 * Validate object type
 */
export function validateObject(
  value: any,
  fieldName: string,
  operation: string
): void {
  validateRequired(value, fieldName, operation);

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    const error = new ValidationError(
      `${fieldName} must be an object`,
      fieldName,
      value
    );
    dbLogger.error(operation, error, { field: fieldName, type: typeof value });
    throw error;
  }
}
