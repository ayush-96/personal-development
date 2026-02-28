/**
 * Global error wrapper function
 * @param {string} context - Error context to identify error source (e.g., 'RAGFlow createDataset failed')
 * @param {Error|any} error - Original error object
 * @param {Object} options - Optional configuration
 * @param {number} options.defaultStatus - Default HTTP status code (when cannot be extracted from error)
 * @param {string} options.defaultMessage - Default error message (when cannot be extracted from error)
 * @returns {Error} Wrapped error object
 */
function wrapError(context, error, options = {}) {
    const {
        defaultStatus = 500,
        defaultMessage = 'An error occurred'
    } = options;

    // Handle HTTP request errors
    if (error.response) {
        const status = error.response.status || error.response.code || defaultStatus;
        const body = error.response.data;
        const message = body?.message || body?.error || error.message || defaultMessage;
        
        const wrappedError = new Error(`[${context}] ${message}`);
        wrappedError.status = status;
        wrappedError.body = body || null;
        wrappedError.originalError = error;
        wrappedError.context = context;
        return wrappedError;
    }

    if (error.code && error.sqlMessage) {
        const wrappedError = new Error(`[${context}] Database error`);
        wrappedError.status = 500;
        wrappedError.originalError = error;
        wrappedError.context = context;
        return wrappedError;
    }

    // Handle regular errors
    const message = error.message || defaultMessage;
    const wrappedError = new Error(`[${context}] ${message}`);
    wrappedError.status = error.status || defaultStatus;
    wrappedError.body = error.body || null;
    wrappedError.originalError = error;
    wrappedError.context = context;
    
    // Preserve original error stack trace
    if (error.stack) {
        wrappedError.stack = error.stack;
    }
    
    return wrappedError;
}

// /**
//  * Create business error (for business logic validation failures)
//  * @param {string} message - Error message
//  * @param {number} status - HTTP status code, default 400
//  * @param {any} data - Additional error data
//  * @returns {Error} Business error object
//  */
// function createBusinessError(message, status = 400, data = null) {
//     const error = new Error(message);
//     error.status = status;
//     error.body = data;
//     error.isBusinessError = true;
//     return error;
// }

// /**
//  * Check if error is a business error
//  * @param {Error} error - Error object
//  * @returns {boolean}
//  */
// function isBusinessError(error) {
//     return error.isBusinessError === true;
// }

module.exports = {
    wrapError,
    // createBusinessError,
    // isBusinessError
};
