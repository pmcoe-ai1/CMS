// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

// Barrel export for all event types and emission helpers

export * from './task-completed';

import type { TaskCompletedEvent } from './task-completed';

// Union type of all domain events
export type DomainEvent = TaskCompletedEvent;

// All event IDs as a literal union
export type DomainEventId = 'task.completed';

// Map of operation ID to the events it emits
export const OPERATION_EVENTS: Record<string, DomainEventId[]> = {
};
