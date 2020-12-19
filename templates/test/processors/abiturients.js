'use strict';

module.exports = {
  path: new RegExp('^/for-abiturients/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    setImmediate( () => {
      callback({
        title: 'Абитуриентам',
        userAthorized: isUserAuthed(sessionContext, sessionToken)
      }, 'abiturients', 0, 5);
    });
  }
};

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}
