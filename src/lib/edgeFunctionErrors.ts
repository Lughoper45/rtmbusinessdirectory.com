/** Extract `{ error: string }` from a failed `supabase.functions.invoke` call. */
export async function getEdgeFunctionErrorMessage(
  error: unknown,
  payload?: { error?: string } | null,
): Promise<string> {
  if (payload?.error) return payload.error;

  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const body = (await context.json()) as { error?: string };
        if (typeof body?.error === "string" && body.error) return body.error;
      } catch {
        // Response body already consumed or not JSON
      }
    }
  }

  if (error instanceof Error && error.message && error.message !== "Edge Function returned a non-2xx status code") {
    return error.message;
  }

  return "Edge function request failed";
}
