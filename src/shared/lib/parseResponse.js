// Step 12A - the query layer's counterpart to zodResolver on the form
// layer (see any CreateXModal/XDetailPage's react-hook-form setup): a
// response gets parsed against the same kind of zod schema, just after a
// GET instead of before a submit. Schemas are built with .passthrough() at
// every object level (see pagedSchema.js and each feature's
// *ResponseSchemas.js), so an unrecognized extra field is kept, never
// stripped - this only ever rejects a response that's missing or
// mis-typed something a screen actually depends on, not a plain backend
// addition the frontend hasn't caught up to yet.
export function parseResponse(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  const issue = result.error.issues[0];
  const path = issue?.path?.length ? issue.path.join('.') : '(root)';
  throw new Error(`Unexpected response shape at "${path}": ${issue?.message ?? 'validation failed'}`);
}
