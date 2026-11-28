// Validates API responses against their schemas.
export function parseResponse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const issue = result.error.issues[0];
  const path = issue?.path?.length ? issue.path.join('.') : '(root)';
  throw new Error(`Unexpected response shape at "${path}": ${issue?.message ?? 'validation failed'}`);
}
