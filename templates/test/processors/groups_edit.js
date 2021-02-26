const router = require('../../../router'),
  qs = require('querystring'),
  ObjectID = require('mongodb').ObjectID;

module.exports = {
  path: new RegExp('^/groups/edit/[^/]+/$'),
  processor(request, response, callback, sessionContext, sessionToken, db) {
    if (sessionToken == null || sessionContext == undefined || sessionContext == null) {
      callback();
      return router.bleed(301, '/login/', response);
    }
    const requestedUrl = decodeURI(request.url);
    const delimeteredUrl = requestedUrl.split('/');
    const groupURL = delimeteredUrl[delimeteredUrl.length - 2];
    db.collection('users').findOne({ _id: sessionContext.id }, { username: 1, securityRole: 1 }, (err, result) => {
      if (err) {
        callback();
        return router.bleed(500, null, response, err);
      }
      const userInfo = result;
      if (userInfo.securityRole.length == 0 && !userInfo.securityRole.includes('superadmin') && !userInfo.securityRole.includes('admin')) {
        callback();
        return router.bleed(403, null, response);
      }
      db.collection('groups').findOne({ url: groupURL }, (err, result) => {
        if (err) {
          callback();
          return router.bleed(500, null, response, err);
        }
        if (result == null) {
          callback();
          return router.bleed(404, requestedUrl, response);
        }
        const groupInfo = result;

        db.collection('users').find({ group: groupInfo._id }, { lastName: 1, name: 1 }).toArray((err, result) => {
          if (err) {
            callback();
            return router.bleed(500, null, response, err);
          }
          const groupList = result;

          if (request.method == 'POST') {
            router.downloadClientPostData(request, (err, data) => {
              if (err) {
                callback();
                return router.bleed(400, null, response);
              }
              try {
                const postData = qs.parse(data);

                if (/[А-яЁё]/gi.test(postData.url)) {
                  return callback({
                    title: 'Изменение группы',
                    groupInfo: postData,
                    errorMessage: 'Имя группы для ссылки должно быть на английском!'
                  }, 'groups_form', 0, 0);
                }

                if (groupURL !== postData.url) {
                  db.collection('groups').findOne({ url: postData.url }, { _id: 1 }, (err, foundGroup) => {
                    if (err) {
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    if (foundGroup) {
                      return callback({
                        title: 'Изменение группы',
                        groupInfo: postData,
                        errorMessage: 'Группа с таким URL уже существует!'
                      }, 'groups_form', 0, 0);
                    } else {
                      db.collection('groups').findOneAndUpdate({ url: postData.url },
                        { $set: {
                        name: postData.name,
                        course: postData.course,
                        fullname: postData.fullname,
                        url: postData.url,
                        typeEducation: postData.typeEducation,
                        elder: new ObjectID(postData.elder)
                      } }, err => {
                        if (err) {
                          callback();
                          return router.bleed(500, null, response, err);
                        }
                        console.log(`Group ${groupURL} info changed!`);
                        callback();
                        return router.bleed(301, '/groups/', response);
                      });
                    }
                  });
                } else {
                  db.collection('groups').findOneAndUpdate({ url: postData.url },
                    { $set: {
                    name: postData.name,
                    course: postData.course,
                    fullname: postData.fullname,
                    url: postData.url,
                    typeEducation: postData.typeEducation,
                    elder: new ObjectID(postData.elder)
                  } }, err => {
                    if (err) {
                      callback();
                      return router.bleed(500, null, response, err);
                    }
                    console.log(`Group ${groupURL} info changed!`);
                    callback();
                    return router.bleed(301, '/groups/', response);
                  });
                }
              } catch (err) {
                console.log(`Processor error groups_edit: ${err}`);
                callback();
                return router.bleed(500, null, response, err);
              }
            });
          } else {
            return callback({
              title: 'Изменение группы',
              groupInfo,
              groupList,
              errorMessage: ''
            }, 'groups_form', 0, 0);
          }
        });
      });
    });
  }
}
