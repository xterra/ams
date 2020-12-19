'use strict';

module.exports = {
  path: new RegExp('^/about/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    setImmediate( () => {
      callback({
        title: 'О нас',
        userAthorized: isUserAuthed(sessionContext, sessionToken)
      }, 'about', 0, 5);
    });
  }
};

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}
