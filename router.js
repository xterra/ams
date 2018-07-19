var fs = require("fs"),
    path = require("path");

var supportedFileTypes = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "txt": "text/raw",
    "js": "text/javascript",
    "pdf": "application/pdf"
};

var responseErrorMessages = {
    0: ["Unknown error", "Something wrong happened, but we do not know what exactly it was."],
    401: ["Unauthorized", "You are not authorized to view this content."],
    403: ["Forbidden", "You are not permitted to view this content."],
    404: ["File not found", "Oh, no! Space invaders destroyed this page! Take revenge of them!"],
    500: ["Internal Server Error", "Something went wrong. We will fix it, we promise."], // TODO: support that code: catch all occurred errors on server part
    503: ["Service Unavailable", "Seems to be server is broken. It will be cured, but actually we do not know when!"]
};

var registeredRoutes = []; // TODO: load routes from file
registeredRoutes.push([new RegExp('\/люди\/$', 'g'), "people"]);
registeredRoutes.push([new RegExp('\/люди\\/\\d{6,}\/$', 'g'), "profile"]);

var currentTemplateName = "test";

var PATHS_templateDir = path.join(__dirname, "templates", currentTemplateName);
var PATHS_templateResourcesDir = path.join(PATHS_templateDir, "resources");
var PATHS_dataDir = path.join(__dirname, "data");


function route(request, response) {
    var match = null;

    var i = 0;
    while (!match && i < registeredRoutes.length) {
        var routeCondition = registeredRoutes[i];
        if (!match && request.url.match(routeCondition[0])) {
            match = routeCondition[1];
        }
        i++;
    }
    if (match) {
        response.end("Hook used from registered path: " + match);
    }

    console.log("An unknown hook used, may be this is a template resource file?");

    var stat;

    var filePathInTemplateResources = path.join(PATHS_templateResourcesDir, request.url);
    if (fs.existsSync(filePathInTemplateResources)) { // TODO: filesystem vulnarability! - non restricted access to nearby hidden-files
        stat = fs.statSync(filePathInTemplateResources);
        if (stat.isFile()) {
            return stream(filePathInTemplateResources, stat, request, response);
        } else {
            return bleed(403, request.url, response);
        }
    }

    console.log("May be this is a file in data dir?");

    var filePathInData = path.join(PATHS_dataDir, request.url);
    if (fs.existsSync(filePathInData)) {
        stat = fs.statSync(filePathInData);
        if (stat.isFile()) {
            return stream(filePathInData, stat, request, response);
        } else {
            return bleed(403, request.url, response);
        }
    }

    bleed(404, request.url, response);
}

function bleed(errorCode, retrievedAddress, response) {
    console.warn("Bleeding an error", errorCode);
    // TODO: log non 404 error
    // TODO: show retrievedAddress for some pages, but avoid XSS-attack
    if (typeof responseErrorMessages[errorCode] !== "object") {
        console.error("Unknown error code " + errorCode + " used!");
        errorCode = 0;
    }
    var errorMessage = responseErrorMessages[errorCode];
    var outputMessage = "<h1>" + errorCode + " " + errorMessage[0] + "</h1><p>" + errorMessage[1] + "</p>";
    response.writeHead(errorCode, {
        "Content-Type": "text/html",
        "Content-Size": outputMessage.length
    });
    response.end(outputMessage);
}

function stream(filePath, fileStatistics, request, response) {
    console.log("Streaming file", filePath);

    var requestPathElements = request.url.split(".");
    var fileExtension = requestPathElements[requestPathElements.length - 1].toLowerCase();
    var contentType;
    if (typeof supportedFileTypes[fileExtension] === "string") {
        contentType = supportedFileTypes[fileExtension];
    }
    if (contentType == null) {
        contentType = "application/octet-stream"
    }
    console.log("Desired content type: ", contentType);
    response.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": fileStatistics.size
    });
    response.write(fs.readFileSync(filePath)); // TODO: fix it - This is super bad shit: rewrite - do as REAL stream!
    response.end();
}

module.exports = {
    route: route,
    bleed: bleed,
    stream: stream
};