import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Fields that must never reach the client, regardless of where they appear
// in the response object graph (nested user relations, etc.).
// NOTE: refreshToken is intentionally NOT here — auth endpoints return it on purpose.
const SENSITIVE_KEYS = new Set(['passwordHash', 'password']);

function strip(value: any, seen = new WeakSet()): any {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (seen.has(value)) return value;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((v) => strip(v, seen));
  }

  for (const key of Object.keys(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      delete value[key];
    } else {
      value[key] = strip(value[key], seen);
    }
  }
  return value;
}

/**
 * Globally strips sensitive fields (passwordHash, etc.) from every HTTP
 * response body. Defense-in-depth: services should already select narrowly,
 * but this guarantees nothing sensitive leaks even when a relation is included
 * wholesale.
 */
@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => strip(data)));
  }
}
