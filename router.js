var fs = require("fs"),
    path = require("path"),
    pug = require("pug"),
    xss = require("xss");

var responseErrorMessages = {
    0: ["Unknown error", "Something wrong happened, but we do not know what exactly it was."],
    401: ["Unauthorized", "You are not authorized to view this content."],
    403: ["Forbidden", "You are not permitted to view this content."],
    404: ["File not found", "Oh, no! Space invaders destroyed this page! Take revenge of them!"],
    500: ["Internal Server Error", "Something went wrong. We will fix it, we promise."],
    503: ["Service Unavailable", "Seems to be server is broken. It will be cured, but actually we do not know when!"]
};

var supportedFileTypes = {};
var pageProcessors = {};
var precompiledPugPages = {};
var cachedRenderedPages = {};
var pugCompilerOptions = {
    pretty: true
};

// TODO: load this variables from configs
var renderTimeout = 5000;
var bleedStacktraceAllowed = true;
var currentTemplateName = "test";

var PATHS_templateDir = path.join(__dirname, "templates", currentTemplateName);
var PATHS_templateResourcesDir = path.join(PATHS_templateDir, "resources");
var PATHS_templateSheathDir = path.join(PATHS_templateDir, "sheath");
var PATHS_templatePreprocessorsDir = path.join(PATHS_templateDir, "processors");
var PATHS_dataDir = path.join(__dirname, "data");
var PATHS_dataPublicDir = path.join(PATHS_dataDir, "public");
var PATHS_dataPrivateDir = path.join(PATHS_dataDir, "private");

function reloadMIMEs() {
    var oldSupportedFileTypes = supportedFileTypes;
    try {
        supportedFileTypes = JSON.parse(fs.readFileSync(path.join(__dirname, "configurations", "mimeTypes.json")));
    } catch (e) {
        console.error("An error occurred while reloading MIME types from disk. Changes reverted!");
        supportedFileTypes = oldSupportedFileTypes;
    }
}

function rebootProcessors(callback) {
    var newPageProcessors = [];
    fs.readdir(PATHS_templatePreprocessorsDir, function (err, filesList) {
        var booted = 0;
        var stat;
        var fileFullPath;
        filesList.forEach(function (fileName) {
            fileFullPath = path.join(PATHS_templatePreprocessorsDir, fileName);
            stat = fs.statSync(fileFullPath);
            if (stat.isFile()) {
                try {
                    newPageProcessors.push(require(fileFullPath));
                    console.log("Booted \"" + fileName + "\" processor");
                } catch (e) {
                    console.error("Can't boot \"" + fileName + "\" processor!", e);
                }
            }
            if (++booted === filesList.length) {
                pageProcessors = newPageProcessors;
                callback(booted);
            }
        });
    });
}

function route(request, response) {
    try {
        var matchedProcessor = null;
        var requestedURL = decodeURI(request.url);

        console.log("Requested page ", requestedURL);

        if (request.method === "GET" && typeof cachedRenderedPages[requestedURL] !== "undefined" && cachedRenderedPages[requestedURL][0] > (new Date().getTime())) {
            console.log("Using page from cache");
            response.writeHead(200, cachedRenderedPages[requestedURL][2]);
            response.write(cachedRenderedPages[requestedURL][1], "utf-8");
            return response.end();
        }

        var i = 0;
        while (!matchedProcessor && i < pageProcessors.length) {
            var routeCondition = pageProcessors[i].path;
            if (!matchedProcessor && routeCondition.test(requestedURL)) {
                matchedProcessor = pageProcessors[i].processor;
            }
            i++;
        }
        if (matchedProcessor) {
            return render(matchedProcessor, requestedURL, request, response);
        }

        var stat;

        var filePathInTemplateResources = path.join(PATHS_templateResourcesDir, requestedURL);
        if (fs.existsSync(filePathInTemplateResources)) { // TODO: filesystem vulnarability! - non restricted access to nearby hidden-files
            stat = fs.statSync(filePathInTemplateResources);
            if (stat.isFile()) {
                return stream(filePathInTemplateResources, stat, request, response);
            } else {
                return bleed(403, requestedURL, response);
            }
        }

        var filePathInData = path.join(PATHS_dataPublicDir, requestedURL);
        if (fs.existsSync(filePathInData)) {
            stat = fs.statSync(filePathInData);
            if (stat.isFile()) {
                return stream(filePathInData, stat, request, response);
            } else {
                return bleed(403, requestedURL, response);
            }
        }

        bleed(404, requestedURL, response);
    } catch (e) {
        bleed(500, null, response, e);
        console.error("An error occurred in router -> route", e);
    }
}

function bleed(errorCode, retrievedAddress, response, error) {
    console.warn("Bleeding an error", errorCode);
    // TODO: show retrievedAddress for some pages, but avoid XSS-attack
    if (typeof responseErrorMessages[errorCode] !== "object") {
        console.error("Unknown error code " + errorCode + " used!");
        errorCode = 0;
    }
    var errorMessage = responseErrorMessages[errorCode];
    var outputMessage = "<h1>" + errorCode + " " + errorMessage[0] + "</h1>" + errorMessage[1] + "<br/><br/><i>AMS Portal Framework @ 2018, by iLeonidze, Swenkal, Spartedo</i>";
    if (retrievedAddress !== null) {
        outputMessage += "<br/><i>Requested address: " + xss(retrievedAddress + "</i>") + "<br><i>Time: " + (new Date().toString()) + "</i>";
    }
    if (typeof error !== "undefined" && error !== null && bleedStacktraceAllowed) {
        outputMessage += "<br/><br/><i style='color:red;'>Error: " + error.stack.replace(/\n/g, "<br/>") + "</i>";
    }
    response.writeHead(errorCode, {
        "Cache-Control": "no-cache",
        "Content-Type": "text/html; charset=utf-8",
        "Content-Size": outputMessage.length
    });
    response.write(outputMessage, "utf-8");
    return response.end();
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
    response.writeHead(200, { // TODO: some caching for specific filetypes
        "Content-Type": contentType,
        "Content-Length": fileStatistics.size
    });
    response.write(fs.readFileSync(filePath)); // TODO: fix it - This is super bad shit: rewrite - do as REAL stream!
    response.end();
}

function render(pageProcessor, requestedURL, request, response) {
    var timeoutBleeded = false;
    var processorTimeout = setTimeout(function () {
        bleed(503, null, response, new Error("Processor reached timeout"));
    }, renderTimeout);
    return pageProcessor(request, response, function (processedData, useSheath, serverCacheTime, clientCacheTime) {
        if (!timeoutBleeded) {
            clearTimeout(processorTimeout);
            try {
                if (typeof serverCacheTime !== "number" || serverCacheTime == null || !serverCacheTime) {
                    serverCacheTime = 0;
                }
                if (typeof clientCacheTime === "undefined" || clientCacheTime == null || !clientCacheTime) {
                    clientCacheTime = "no-cache";
                } else {
                    clientCacheTime = "max-age=" + clientCacheTime
                }
                if (useSheath) {
                    if (typeof useSheath !== "string") {
                        throw new Error("Incorrect sheath variable type used! Can be only String.");
                    }
                    if (typeof precompiledPugPages[useSheath] === "undefined") {
                        precompiledPugPages[useSheath] = pug.compileFile(path.join(PATHS_templateSheathDir, useSheath + ".pug"), pugCompilerOptions);
                    }
                    var html = precompiledPugPages[useSheath](processedData);
                    var head = {
                        "Cache-Control": clientCacheTime,
                        "Content-Type": "text/html; charset=utf-8",
                        "Content-Length": html.length
                    };
                    response.writeHead(200, head);
                    response.write(html, "utf-8");
                    response.end();
                    if (serverCacheTime > 0) cachedRenderedPages[requestedURL] = [new Date().getTime() + (serverCacheTime * 1000), html, head];
                }
            } catch (e) {
                bleed(500, null, response, e);
                console.error("An error occurred in router -> renderer", e);
            }
        }
    });
}

function resetPrecompiledPugs() {
    precompiledPugPages = {};
}

function resetCachedRenderedPages() {
    cachedRenderedPages = {};
}

module.exports = {
    prepare: function (callback) {
        return rebootProcessors(function (booted) {
            reloadMIMEs();
            callback(booted);
        });
    },
    route: route,
    bleed: bleed,
    stream: stream,
    reloadMIMEs: reloadMIMEs,
    rebootProcessors: rebootProcessors,
    resetPrecompiledPugs: resetPrecompiledPugs,
    resetCachedRenderedPages: resetCachedRenderedPages
};