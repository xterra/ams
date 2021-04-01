const isUserAuthed = require('./common/permission_check.js').isUserAuthed;

module.exports = {
  path: new RegExp('^/for-abiturients/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    setImmediate( () => {
      callback({
        title: 'Абитуриентам',
        userAthorized: check.isUserAuthed(sessionContext, sessionToken)
      }, 'abiturients', 0, 5);
    });
  }
};
