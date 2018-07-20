module.exports = {
    path: new RegExp(/^\/профиль\/\d{6,}\/$/u),
    processor: function (request, response, callback) {

        var urlPath = decodeURI(request.url);
        var id = urlPath.match(/\d+/g);

        callback({
            userID: id
        }, "profile", 5, 5);
    }
};