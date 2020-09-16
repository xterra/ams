'use strict';

module.exports = {
  path: new RegExp('^/contacts/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    setImmediate( () => {
      callback({
        title: 'Контакты',
        userAthorized: isUserAuthed(sessionContext, sessionToken)
      }, 'contacts', 5, 5);
    });
  }
};

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}
