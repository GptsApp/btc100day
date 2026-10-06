// Keep the legacy Pages Functions route on the same implementation as the
// Worker entry point used by wrangler.toml.
import worker from '../../worker.js';

export async function onRequest(context) {
  return worker.fetch(context.request, context.env, context);
}
