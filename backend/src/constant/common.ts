// ===============================
// HTTP STATUS CODE
// ===============================

// 2xx – Success
export const STATUS_OK_200 = 200;
export const STATUS_CREATED_201 = 201;
export const STATUS_ACCEPTED_202 = 202;
export const STATUS_NO_CONTENT_204 = 204;

// 3xx – Redirect
export const STATUS_MOVED_PERMANENTLY_301 = 301;
export const STATUS_FOUND_302 = 302;
export const STATUS_NOT_MODIFIED_304 = 304;

// 4xx – Client Error
export const STATUS_BAD_REQUEST_400 = 400;
export const STATUS_UNAUTHORIZED_401 = 401;
export const STATUS_FORBIDDEN_403 = 403;
export const STATUS_NOT_FOUND_404 = 404;
export const STATUS_METHOD_NOT_ALLOWED_405 = 405;
export const STATUS_CONFLICT_409 = 409;
export const STATUS_GONE_410 = 410;
export const STATUS_UNSUPPORTED_MEDIA_TYPE_415 = 415;
export const STATUS_UNPROCESSABLE_422 = 422;

// 5xx – Server Error
export const STATUS_INTERNAL_SERVER_ERROR_500 = 500;
export const STATUS_NOT_IMPLEMENTED_501 = 501;
export const STATUS_BAD_GATEWAY_502 = 502;
export const STATUS_SERVICE_UNAVAILABLE_503 = 503;
export const STATUS_GATEWAY_TIMEOUT_504 = 504;
