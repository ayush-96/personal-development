class BusinessError extends Error {
    constructor(message = 'Business error', code = 1000) {
        super(message);
        this.code = code;         
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = { BusinessError };