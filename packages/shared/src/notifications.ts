import { randomUUID } from "node:crypto";

type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

export type NotificationEventInput = {
  userId: string;
  type: string;
  actorUserId?: string | null;
  refType?: string | null;
  refId?: string | null;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
  availableAt?: Date | null;
};

export async function enqueueNotificationEventWithClient(client: Queryable, input: NotificationEventInput): Promise<void> {
  await client.query(
    `INSERT INTO core.notification_events
      (id, user_id, type, actor_user_id, ref_type, ref_id, payload, idempotency_key, available_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW()))
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [
      randomUUID(),
      input.userId,
      input.type,
      input.actorUserId ?? null,
      input.refType ?? null,
      input.refId ?? null,
      input.payload ?? {},
      input.idempotencyKey,
      input.availableAt ?? null
    ]
  );
}
