var fs = require("fs"),
    templator = require("./templator.js"),
    path = require("path");


var types = {
    "png": "image/png",
    "jpg": "image/jpg",
    "jpeg": "image/jpeg",
    "txt": "text/raw",
    "js": "text/javascript",
    "pdf": "application/pdf"
};

var routes = [];

routes.push([new RegExp('\/people\/$', 'g'), "people"]);
routes.push([new RegExp('\/people\\/\\d{6,}\/$', 'g'), "profile"]);

module.exports = {
    parse: function (request, response) {
        var match = null;
        console.log("Starting parsing..");
        routes.forEach(function (regexp) { // # TODO: rewrite to while to increase perfomance
            console.log(request.url + " == " + regexp[0]);
            if (!match && request.url.match(regexp[0])) {
                match = regexp[1];
            }
        });
        if (match) {
            return templator.proceed(match, request, response);
        }

        var filePath = path.join(__dirname, "templates/test", request.url);

        if (fs.existsSync(filePath)) { // TODO: filesystem vulnarability! - non restricted access to nearby hidden-files

            console.log("Loading for file " + filePath);

            var stat = fs.statSync(filePath);

            if (stat.isFile()) {

                var elements = request.url.split(".");
                var extension = elements[elements.length - 1].toLowerCase();
                var content_type = null;

                if (typeof types[extension] === "string") {
                    content_type = types[extension];
                }

                if (content_type == null) {
                    content_type = "application/octet-stream"
                }

                console.log("Extension desired: " + extension);
                console.log("Content type desired: " + content_type);

                response.writeHead(200, {
                    'Content-Type': content_type,
                    'Content-Length': stat.size
                });
                response.write(fs.readFileSync(filePath));
                response.end();
            } else {
                response.writeHead(403, {'Content-Type': 'text/html '});
                response.end("<h1>403 Forbidden</h1><p>You do not have access to dir " + path.normalize(request.url) + "</p>");
            }


        }

        response.writeHead(404, {'Content-Type': 'text/html '});
        response.end("<h1>There is no requested resources</h1>");
    }
};