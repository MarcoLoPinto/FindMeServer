const middlewareErrorHandler = (err, req, res, next) => {
    const status_code = res.statusCode && res.statusCode != 200 ? res.statusCode : 500

    res.status(status_code)

    res.json({
        error_message: err.message,
        stack: process.env.NODE_ENV == 'development' ? err.stack : null
    })

}

module.exports = middlewareErrorHandler