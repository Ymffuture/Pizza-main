/**
 * Parses a FastAPI error into a readable string.
 * FastAPI detail can be:
 *   - a plain string:       { detail: "Not found" }
 *   - a validation array:   { detail: [{loc:[...], msg:"...", type:"..."}] }
 */
export function parseApiError(err) {
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail;

  let msg;
  if (Array.isArray(detail)) {
    msg = detail.map(d => d.msg || JSON.stringify(d)).join(" · ");
  } else if (typeof detail === "string") {
    msg = detail;
  } else {
    msg = err?.message || "Unknown error";
  }

  const hint =
    status === 401 ? " (not authenticated)"
    : status === 403 ? " (not authorized — check admin role)"
    : status === 404 ? " (endpoint not found)"
    : status === 422 ? " (validation error)"
    : status ? ` (HTTP ${status})`
    : "";

  return msg + hint;
}
