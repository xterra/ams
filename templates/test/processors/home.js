module.exports = {
    path: new RegExp("/$"),
    processor: function (request, response, callback) {


        callback({
            pageTitle: "Test page title",
            youAreUsingPug: true
        }, "home", 6400);
    }
};