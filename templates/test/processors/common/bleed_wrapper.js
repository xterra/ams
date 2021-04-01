const bleed = require('../../../../router.js').bleed;

module.exports = {
  redirectToLoginPage,
  redirectToDiscByAllias,
  redirectTo404Page,
  redirectTo500Page,
  redirectWithErrorCode
}

function redirectToLoginPage(response, callback) {
  callback();
  return bleed(301, '/login/', response);
}

function redirectToDiscByAllias(response, disciplineAllias, callback) {
  callback()
  return bleed(301, `/disciplines/${disciplineAllias}/`, response);
}

/* ERRORS */
function redirectTo404Page(response, clientUrl, callback) {
  callback();
  return bleed(404, clientUrl, response);
}

function redirectTo500Page(response, err, callback) {
  callback();
  return bleed(500, null, response, err);
}

function redirectWithErrorCode(response, code, err, callback) {
  callback();
  return bleed(code, null, response, err);
}
