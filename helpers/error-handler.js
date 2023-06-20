const mongoose = require('mongoose');
const path = require('path');

const getUniqueErrorMessage = err => {
  let output = '';

  try {
    const fieldName = err.message.substring(
      err.message.lastIndexOf('.$') + 2,
      err.message.lastIndexOf('_1')
    );
    output = `${fieldName.charAt(0).toUpperCase()}${fieldName.slice(
      1
    )} already exists`;
  } catch (ex) {
    output = 'Unique field already exists';
  }

  return output;
};

const getErrorMessage = err => {
  let message = '';

  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = getUniqueErrorMessage(err);
        break;
      default:
        message = 'Something went wrong';
    }
  } else {
    // eslint-disable-next-line
    for (const errName in err.errors) {
      if (err.errors[errName].message) message = err.errors[errName].message;
    }
  }
  return message;
};

// main errorHandler
const errorHandler = (error, req, res, next) => {
  const errorStatusCode = error.statusCode || 500;
  // .toString() to remove unnecessary error stack
  const errorReason = error.reason && error.reason.toString();

  if (error.reason) {
    console.error('| ==-- Error-Reason --== |:', errorReason);
  }

  console.error('| ==--- MyErrorStack ---== |:', error.stack);

  // sent to default express errorHandler
  // can trigger if two res. ex. res.render() and res.json()
  if (res.headersSent) {
    console.error('* * * * -Header Sent-');
    return next(error);
  }

  // jwt-express's authentication error-handling
  // redundant error.name
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: `${error.name} : ${error.message}`
    });
  }

  // if (errorStatusCode === 301) {
  //   console.error('| =- * -Redirecting- -= |');

  //   return res.status(301).redirect('/not-found');
  // }

  // NotFound Error
  if (errorStatusCode === 404 && req.accepts('html')) {
    return res
      .status(errorStatusCode)
      .sendFile(path.join(__dirname, '..', 'views', '404.html'));
  }

  if (req.accepts('json')) {
    return res.status(errorStatusCode).json({ error: '404 not found' });
  }

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

module.exports = { getErrorMessage, errorHandler };
