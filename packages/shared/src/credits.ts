import { randomUUID } from "node:crypto";

type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
};

export type CreditIntentInput = {
  userId: string;
  action: string;
  amount?: number;
  refType?: string | null;
  refId?: string | null;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
  availableAt?: Date | null;
};

export async function enqueueCreditIntentWithClient(client: Queryable, input: CreditIntentInput): Promise<void> {
  await client.query(
    `INSERT INTO core.credit_intents
      (id, user_id, action, amount, ref_type, ref_id, payload, idempotency_key, available_at)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW()))
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [
      randomUUID(),
      input.userId,
      input.action,
      Number(input.amount ?? 0),
      input.refType ?? null,
      input.refId ?? null,
      input.payload ?? {},
      input.idempotencyKey,
      input.availableAt ?? null
    ]
  );
}
