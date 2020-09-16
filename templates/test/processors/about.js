'use strict';

module.exports = {
  path: new RegExp('^/about/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    callback({
      title: 'О нас',
      userAthorized: isUserAuthed(sessionContext, sessionToken)
    }, 'about', 5, 5);
  }
};

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}
