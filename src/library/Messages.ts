function APIError(shorthand: string, message: string, errId?: string): {
    code: string,
    message: string,
    id?: string
} {
    /* Allow for middle-response-ware to be passed in */

    return {
        code: shorthand,
        message,
        id: errId || "common"
    }
}

export { APIError }