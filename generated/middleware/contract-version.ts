// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// X-Contract-Version response middleware
// Stamps every provider response with the contract version
// header so consumers can detect version mismatches.
// ────────────────────────────────────────────────────────────

/** The contract version for this object 's published operations */
export const CONTRACT_VERSION = '1.0.0' as const;

/** The domain/object ID for this provider */
export const PROVIDER_DOMAIN = 'cms' as const;

/** Header name used for contract version propagation */
export const CONTRACT_VERSION_HEADER = 'X-Contract-Version' as const;

/**
 * Framework-agnostic middleware that adds X-Contract-Version
 * header to all provider operation responses.
 *
 * Express usage:
 *   app.use(contractVersionMiddleware());
 *
 * Standalone usage:
 *   const headers = contractVersionHeaders();
 */
export function contractVersionMiddleware() {
  return (req: unknown, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    res.setHeader(CONTRACT_VERSION_HEADER, CONTRACT_VERSION);
    next();
  };
}

/**
 * Returns headers object with X-Contract-Version set.
 * Use when manually constructing responses outside Express.
 */
export function contractVersionHeaders(): Record<string, string> {
  return { [CONTRACT_VERSION_HEADER]: CONTRACT_VERSION };
}
