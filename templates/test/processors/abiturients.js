'use strict';

module.exports = {
  path: new RegExp('^/for-abiturients/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    callback({
      title: 'Абитуриентам',
      userAthorized: isUserAuthed(sessionContext, sessionToken)
    }, 'abiturients', 5, 5);
  }
};

function isUserAuthed(sessionContext, sessionToken) {
  return (typeof sessionToken === 'string' &&
    sessionContext instanceof Object &&
    sessionContext['id'] !== undefined);
}
