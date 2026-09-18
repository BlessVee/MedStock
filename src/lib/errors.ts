// Maps raw Supabase/Postgres errors to a friendly message; logs the detail
// separately so we never leak internal error text into the UI.
export function friendlyError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  console.error(err);

  const code = (err as { code?: string } | null)?.code;
  const message = (err as { message?: string } | null)?.message ?? '';

  if (code === '23505' || message.includes('duplicate key')) {
    return 'That name or number is already in use. Please choose a different one.';
  }
  if (code === '23503') {
    return 'This record is linked to other data and cannot be changed that way.';
  }
  if (code === '23502') {
    return 'A required field was missing. Please try again.';
  }
  if (code === '23514' || message.toLowerCase().includes('check constraint')) {
    return 'One of the values entered is not valid.';
  }
  if (
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('network')
  ) {
    return 'Network error — please check your connection and try again.';
  }
  return fallback;
}
