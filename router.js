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

routes.push([new RegExp('\/профиль\/?$', 'g'), "people"]);
routes.push([new RegExp('\/профиль\\/\\d{6,}\/?$', 'g'), "profile"]);
routes.push([new RegExp('\/преподаватели\/$', 'g'), "teachers"]);
routes.push([new RegExp('\/книги\/$', 'g'), "books"]);
routes.push([new RegExp('\\/книги\\/монографии\\/$', 'g'), "monographs"]);
routes.push([new RegExp('\\/книги\\/учебники\\/$', 'g'), "textbooks"]);
routes.push([new RegExp('\\/книги\\/учебные_пособия\\/$', 'g'), "training_aids"]);
routes.push([new RegExp('\\/материалы\/$', 'g'), "materials"]);
//....
routes.push([new RegExp('\/$', 'g'), "home"]);
routes.push([new RegExp('\/логин\/$', 'g'), "login"]);
routes.push([new RegExp('\/книги\/$', 'g'), "books"]);
routes.push([new RegExp('\/лецкий\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/варфоломеев\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/семин\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/маркова\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/соймина\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/костюковская\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/ивницкий\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/павлов\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/дружинин\/$', 'g'), "teacher_landing"]);
routes.push([new RegExp('\/нуждин\/$', 'g'), "teacher_landing"]);
//....
routes.push([new RegExp('\/карта\/$', 'g'), "map"]);
routes.push([new RegExp('\/контакты\/$', 'g'), "contacts"]);
routes.push([new RegExp('\/новости\/$', 'g'), "news"]);
routes.push([new RegExp('\/новости\/$', 'g'), "news"]);

module.exports = {
    parse: function (request, response) {
        var match = null;
        var clientURL=decodeURI(request.url);
        console.log("Starting parsing..");
        routes.forEach(function (regexp) { // # TODO: rewrite to while to increase perfomance
            console.log(clientURL + " == " + regexp[0]);
            if (!match && clientURL.match(regexp[0])) {
                match = regexp[1];
            }
        });
        if (match) {
            return templator.proceed(match, request, response);
        }

        var filePath = path.join(__dirname, "templates/test", clientURL);

        if (fs.existsSync(filePath)) { // TODO: filesystem vulnarability! - non restricted access to nearby hidden-files

            console.log("Loading for file " + filePath);

            var stat = fs.statSync(filePath);

            if (stat.isFile()) {

                var elements = clientURL.split(".");
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
                response.end("<h1>403 Forbidden</h1><p>You do not have access to dir " + path.normalize(clientURL) + "</p>");
            }


        }

        response.writeHead(404, {'Content-Type': 'text/html '});
        response.end("<h1>There is no requested resources</h1>");
    }
};