/**
 * Validates Thai PromptPay ID
 * Valid format: Phone number - 10 digits starting with 0 (e.g., 0812345678)
 */
export function isValidPromptPayId(id: string): boolean {
  if (!id) return true; // Empty is OK (optional field)
  const cleaned = id.replace(/[-\s]/g, '');
  // Phone number: 10 digits starting with 0
  if (/^0\d{9}$/.test(cleaned)) return true;
  return false;
}

/**
 * Cleans PromptPay ID by removing dashes and spaces
 */
export function formatPromptPayId(id: string): string {
  return id.replace(/[-\s]/g, '');
}
