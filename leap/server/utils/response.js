const response = {
    success(data, message = 'Operation successful', code = "OK") {
        return {
            code,
            success: true,
            message,
            data
        };
    },

    error(message = 'Internal server error', code = 1100, data = null) {
        return {
            code,
            success: false,
            message,
            data
        };
    }
};

module.exports = response;