const qs = require('querystring'),
      router = require("../../../router"),
      security = require("../../../security");

module.exports = {
  path: new RegExp("^\/disciplines\/$"),
  processor: function(request, response, callback, sessionContext, sessionToken, db){
    db.collection("disciplines").find().sort({name: 1}).toArray(function(err, result){
      if(err){
        callback();
        router.bleed(500, null, response, err);
      }
      const disciplines = result;
      if( sessionContext !== undefined && sessionContext !== null && "login" in sessionContext){
        db.collection("users").findOne({username: sessionContext.login}, {securityRole : 1, username : 1}, function(err, result){
          if(err){
            callback();
            return router.bleed(500, null, response, err);
          }
          let userInfo = result;
          if(userInfo.securityRole.length !== 0 && userInfo.securityRole.includes('teacher')){
            let teacherDisciplines = [],
                otherDisciplines = [];
            for(let disc in disciplines){
              if(disciplines[disc].editors !== undefined && disciplines[disc].editors.includes(userInfo._id.toString())){
                teacherDisciplines.push(disciplines[disc]);
              } else{
                otherDisciplines.push(disciplines[disc]);
              }
            }
            return callback({
              title: "Дисциплины",
              urlDiscDetail: "/disciplines/",
              teacherDisciplines: teacherDisciplines,
              otherDisciplines: otherDisciplines,
              userInfo: userInfo
            }, "disciplines", 0, 0);
          }
          callback({
            title: "Дисциплины",
            urlDiscDetail: "/disciplines/",
            disciplines: disciplines,
            userInfo: userInfo
          }, "disciplines", 0, 0);
        });
      } else {
        callback();
        return router.bleed(301, "/login/", response);
      }
    });
  }
}
