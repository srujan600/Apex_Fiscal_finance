import { z } from 'zod';
import { NovaValidationError } from './nova.errors';

export const NovaExplanationSchema = z.object({
  summary: z.string().min(5),
  risk_assessment: z.string().min(5),
  recommendations: z.array(z.string()).default([]),
});

/**
 * Strips sensitive authentication tokens, database connection details, passwords, and private secrets
 * before any prompt is dispatched to the Aczen Nova API.
 */
export function sanitizeContextForNova<T extends Record<string, any>>(rawContext: T): T {
  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'key',
    'auth',
    'cookie',
    'session',
    'hash',
    'tx_hash',
    'credit_card',
    'ssn',
    'database_url',
  ];

  const sanitized: Record<string, any> = {};

  for (const [k, v] of Object.entries(rawContext)) {
    const lowerKey = k.toLowerCase();
    const isSensitive = sensitiveKeys.some((s) => lowerKey.includes(s));

    if (isSensitive) {
      continue; // exclude completely
    }

    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      sanitized[k] = sanitizeContextForNova(v);
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized as T;
}

/**
 * Validates and parses raw text or JSON response from Nova.
 */
export function validateNovaJsonOutput(content: string) {
  try {
    // Extract JSON if wrapped in markdown code blocks
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    const validated = NovaExplanationSchema.safeParse(parsed);

    if (!validated.success) {
      // If schema doesn't match perfectly, construct best-effort structured response
      return {
        summary: String(parsed.summary || cleaned.slice(0, 300)),
        risk_assessment: String(parsed.risk_assessment || 'Algorithmic policy threshold evaluation applies.'),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
      };
    }

    return validated.data;
  } catch (_e) {
    // If text response, format gracefully
    return {
      summary: content.slice(0, 400),
      risk_assessment: 'Derived from configured corporate policy and ceiling headroom.',
      recommendations: [],
    };
  }
}
