const mongoose = require('mongoose');
// const path = require('path');

// main errorHandler
const errorHandler = (error, req, res, next) => {
  const errorStatusCode = error.statusCode || 500;
  // .toString() to remove unnecessary error stack
  const errorReason = error.reason && error.reason.toString();

  if (error.reason) {
    console.error('| ==-- Error-Reason --== |:', errorReason);
  }

  // console.error('| ==--- MyErrorStack ---== |:', error.stack);
  console.log(String(error));

  // sent to default express errorHandler
  // can trigger if two res. ex. res.render() and res.json()
  if (res.headersSent) {
    console.error('* * * * -Header Sent-');
    return next(error);
  }

  // jwt-express's authentication error-handling
  // redundant error.name??
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: `${error.name} : ${error.message}`
    });
  }

  if (error.statusCode === 400) {
    return res.status(400).json({
      error: `${error.name} : ${error.message}`
    });
  }

  if (error.statusCode === 401) {
    return res.status(401).json({
      error: `${error.name} : ${error.message}`
    });
  }

  // to separate maybe
  if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) {
    return res.status(401).json({
      error: error.message
    });
  }

  // mongoose Error, duplicate
  // && error.keyPattern.email
  if (error.name === 'MongoError' && [11000, 11001].includes(error.code)) {
    const uniqueVal = Object.values(error.keyValue);

    // console.log(getUniqueErrorMessage(error))
    return res.status(409).json({ error: `${uniqueVal} already exist` });
  }

  if (error.name === 'ValidationError') {
    // console.log('--Validation Error--');

    return res.status(400).json({
      error: 'validation error'
    });
  }

  if (error.name === 'MongooseError') {
    console.log('--Mongoose Error--');
  }

  if (error.name === 'UrlError') {
    return res.status(404).json({
      error: `cannot do ${req.method} on ${req.url}`
    });
  }

  // if (errorStatusCode === 301) {
  //   console.error('| =- * -Redirecting- -= |');

  //   return res.status(301).redirect('/not-found');
  // }

  // NotFound Error
  // if (errorStatusCode === 404 && req.accepts('html')) {
  //   return res
  //     .status(errorStatusCode)
  //     .sendFile(path.join(__dirname, '..', 'views', '404.html'));
  // }

  // clientError??
  if (req.xhr) {
    console.log('* * * xhr!!!');
    return res.status(500).json({ error: 'Something failed - xhr jquery' });
  }

  // general error
  // final
  return res.status(errorStatusCode).json({
    mainErrorHandler: { errorMsg: error.toString(), reason: errorReason }
  });
};

module.exports = { errorHandler };
