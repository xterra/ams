var path = require("path"),
    router = require("../../../router.js");

module.exports = {
    path: new RegExp(/^\/профиль\/$/u),
    processor: function (request, response, callback) {
        adadw
        router.bleed(301, "../../", response);
        callback();
    }
};