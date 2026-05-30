/**
 * Parse FastAPI / Axios errors into a user-friendly message.
 *
 * Supports:
 * - FastAPI string detail
 * - FastAPI validation errors
 * - Network errors
 * - Timeouts
 * - Unexpected server responses
 *
 * @param {any} error
 * @returns {string}
 */
export const parseApiError = (error) => {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;

  const statusHints = {
    400: "Bad request",
    401: "Not authenticated",
    403: "Not authorized",
    404: "Endpoint not found",
    409: "Conflict",
    422: "Validation error",
    429: "Too many requests",
    500: "Internal server error",
    502: "Bad gateway",
    503: "Service unavailable",
  };

  let message = "Something went wrong";

  if (Array.isArray(detail)) {
    message = detail
      .map((item) => {
        const field = item?.loc?.slice(1)?.join(".");
        return field
          ? `${field}: ${item.msg}`
          : item.msg;
      })
      .join(" • ");
  } else if (typeof detail === "string") {
    message = detail;
  } else if (error?.code === "ECONNABORTED") {
    message = "Request timed out";
  } else if (!error?.response) {
    message = "Unable to connect to the server";
  } else {
    message = error?.message || message;
  }

  return status
    ? `${message} (${statusHints[status] || `HTTP ${status}`})`
    : message;
};
