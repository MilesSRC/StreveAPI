// Report contains the error codes that should be sent to Sentry.
const report = [
    "invalid_token_missing",
    "package_not_found",
    "invalid_token_failed",
    "internal_error",
    "user_not_found",
    "unauthorized"
]

function APIError(shorthand: string, message: string, details?: {
    id?: string,
    extra?: any
}): {
    code: string,
    message: string,
    id?: string
} {
    /* Allow for middle-response-ware to be passed in */
    if (report.includes(shorthand)) {
        console.error(`[APIError] ${shorthand}: ${message}`)
    }

    return {
        code: shorthand,
        message,
        id: details?.id || "common"
    }
}

export { APIError }