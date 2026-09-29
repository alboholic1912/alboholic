import "server-only";
import { createClient } from "@/lib/supabase/server";
import { estimateCostUsd } from "./models";
import type { UsageInfo } from "./anthropic";

// Logging must never break content generation: the tokens were already spent,
// so a failure here (e.g. the ai_usage table not created yet) is only logged.
export async function logUsage(contentType: string, usage: UsageInfo) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("ai_usage").insert({
      content_type: contentType,
      model: usage.model,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cache_read_tokens: usage.cacheReadTokens,
      cache_write_tokens: usage.cacheWriteTokens,
    });
    if (error) console.error("[ai_usage] Could not log usage:", error.message);
  } catch (err) {
    console.error("[ai_usage] Could not log usage:", err);
  }
}

export interface UsageBucket {
  generations: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface UsageSummary {
  month: UsageBucket;
  allTime: UsageBucket;
  byModel: Record<string, UsageBucket>;
}

const emptyBucket = (): UsageBucket => ({ generations: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 });

function add(bucket: UsageBucket, inputTokens: number, outputTokens: number, costUsd: number) {
  bucket.generations += 1;
  bucket.inputTokens += inputTokens;
  bucket.outputTokens += outputTokens;
  bucket.costUsd += costUsd;
}

/** Returns null if the table can't be read (e.g. the migration hasn't been run). */
export async function getUsageSummary(): Promise<UsageSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_usage")
    .select("created_at, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens");
  if (error) {
    console.error("[ai_usage] Could not read usage:", error.message);
    return null;
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const summary: UsageSummary = { month: emptyBucket(), allTime: emptyBucket(), byModel: {} };
  for (const row of data ?? []) {
    // Cache reads/writes are billed at different rates; the estimate counts them
    // as plain input, which is fine since generations don't use caching.
    const input = row.input_tokens + row.cache_read_tokens + row.cache_write_tokens;
    const cost = estimateCostUsd(row.model, input, row.output_tokens);
    add(summary.allTime, input, row.output_tokens, cost);
    if (new Date(row.created_at) >= monthStart) add(summary.month, input, row.output_tokens, cost);
    add((summary.byModel[row.model] ??= emptyBucket()), input, row.output_tokens, cost);
  }
  return summary;
}
