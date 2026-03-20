// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit manually.
// Source: cms.canonical-model.yaml v1.0.0
// Generator: codegen.js
// Regenerate: node codegen.js cms.canonical-model.yaml
// ─────────────────────────────────────────────────────────────────────────────

// event:       task.completed
// name:        Task Completed
// entityRef:   task
// version:     1.0
// intentRef:   manage-tasks
//
// Do not modify this file. Changes here will be overwritten by codegen.

import type { Task } from '../interfaces/Task';
import type { TaskStatus } from '../interfaces/enums';

/** Payload for Task Completed event */
export interface TaskCompletedEventPayload {
  id: string;
  title: string;
  status: TaskStatus;
}

/** Event: Task Completed */
export interface TaskCompletedEvent {
  readonly eventId: 'task.completed';
  readonly timestamp: Date;
  readonly version: '1.0';
  payload: TaskCompletedEventPayload;
}

/** Emit Task Completed event with typed payload */
export function emitTaskCompleted(payload: TaskCompletedEventPayload): TaskCompletedEvent {
  return {
    eventId: 'task.completed',
    timestamp: new Date(),
    version: '1.0',
    payload,
  };
}
