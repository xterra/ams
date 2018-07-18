module.exports = {
    proceed: function (hook, request, response) {
        response.end("Hook used from registered path: " + hook);
    }
};