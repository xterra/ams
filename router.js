var fs = require("fs"),
    path = require("path"),
    pug = require("pug"),
    xss = require("xss"),
    ini = require("ini");

var responseErrorMessages = {
    306: ["Unknown error", "Something wrong happened, but we do not know what exactly it was."],

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
    pretty: false
};

var renderTimeout = 5000;
var bleedStacktraceAllowed = false;
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
        supportedFileTypes = JSON.parse(fs.readFileSync(path.join(__dirname, "configurations", "mimeTypes.json"), "utf-8"));
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
                    console.log("Booted processor " + fileName);
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

    if (response.finished) return;

    if (errorCode === 301 || errorCode === 302) {
        console.log("Redirecting " + errorCode + " to " + retrievedAddress);
        response.writeHead(errorCode, {
            "Cache-Control": "no-cache",
            "Location": retrievedAddress
        });
        response.end();
        return;
    }

    console.warn("Bleeding an error", errorCode);
    if (typeof responseErrorMessages[errorCode] !== "object") {
        console.error("Unknown error code " + errorCode + " used!");
        errorCode = 306;
    }

    // Prepare data for bleed
    var errorMessage = responseErrorMessages[errorCode];
    var timestamp = new Date().toString();
    var retrievedAddressNoXSS = xss(retrievedAddress);

    // Search for custom error template
    var sheathName = "$httpErr" + errorCode;
    var sheathPath = path.join(PATHS_templateSheathDir, "errors", errorCode + ".pug");
    var errorTrace = (typeof error !== "undefined" && error !== null && bleedStacktraceAllowed) ? error.stack : null
    var responseData;
    if (fs.existsSync(sheathPath)) {
        if (typeof precompiledPugPages[sheathName] === "undefined") {
            precompiledPugPages[sheathName] = pug.compileFile(sheathPath, pugCompilerOptions);
        }
        responseData = precompiledPugPages[sheathName]({
            code: errorCode,
            title: errorMessage[0],
            description: errorMessage[1],
            timestamp: timestamp,
            url: retrievedAddressNoXSS
        });
    } else {
        responseData = "<h1>" + errorCode + " " + errorMessage[0] + "</h1>" + errorMessage[1] + "<br/><br/><i>AMS Portal Framework @ 2018, by iLeonidze, Swenkal, Spartedo</i>";
        responseData += "<br/><i>Requested address: " + retrievedAddressNoXSS + "</i>" + "<br><i>Time: " + timestamp + "</i>";
        if (errorTrace !== null) {
            responseData += "<br/><br/><p style='color:red;font-family: Consolas, sans-serif;'>Error: " + errorTrace.replace(/\n/g, "<br/>") + "</p>";
        }
    }

    response.writeHead(errorCode, {
        "Cache-Control": "no-cache",
        "Content-Type": "text/html; charset=utf-8",
        "Content-Size": responseData.length
    });
    response.write(responseData, "utf-8");
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
    response.writeHead(200, { // TODO: some client caching policies for specific filetypes
        "Content-Type": contentType,
        "Content-Length": fileStatistics.size
    });

    var readStream = fs.createReadStream(filePath);
    readStream.pipe(response);
}

function render(pageProcessor, requestedURL, request, response) {
    try {
        var timeoutBleeded = false;
        var processorTimeout = setTimeout(function () {
            if (!response.finished) bleed(503, null, response, new Error("Processor reached timeout"));
        }, renderTimeout);
        return pageProcessor(request, response, function (processedData, useSheathName, serverCacheTime, clientCacheTime, contentType) {
            if (!timeoutBleeded) {
                clearTimeout(processorTimeout);
                if (typeof processedData !== "undefined" && processedData !== null) {
                    try {
                        if (typeof serverCacheTime !== "number" || serverCacheTime == null || !serverCacheTime) {
                            serverCacheTime = 0;
                        }
                        if (typeof clientCacheTime === "undefined" || clientCacheTime == null || !clientCacheTime) {
                            clientCacheTime = "no-cache";
                        } else {
                            clientCacheTime = "max-age=" + clientCacheTime
                        }
                        if (useSheathName) {
                            contentType = "text/html; charset=utf-8";
                            if (typeof useSheathName !== "string") {
                                throw new Error("Incorrect sheath variable type used! Can be only String.");
                            }
                            if (typeof precompiledPugPages[useSheathName] === "undefined") {
                                precompiledPugPages[useSheathName] = pug.compileFile(path.join(PATHS_templateSheathDir, useSheathName + ".pug"), pugCompilerOptions);
                            }
                            var responseData = precompiledPugPages[useSheathName](processedData);
                        } else {
                            if (typeof contentType === "undefined" || contentType == null) {
                                contentType = "text/plain; charset=utf-8";
                            }
                            responseData = processedData;
                        }
                        var head = {
                            "Cache-Control": clientCacheTime,
                            "Content-Type": contentType,
                            "Content-Length": responseData.length
                        };
                        response.writeHead(200, head);
                        response.write(responseData);
                        response.end();
                        if (serverCacheTime > 0) cachedRenderedPages[requestedURL] = [new Date().getTime() + (serverCacheTime * 1000), responseData, head];
                    } catch (e) {
                        bleed(500, null, response, e);
                        console.error("An error occurred in router -> renderer (after processor)", e);
                    }
                }
            }
        });
    } catch (e) {
        bleed(500, null, response, e);
        console.error("An error occurred in router -> renderer (on processor)", e);
    }
}

function resetPrecompiledPugs() {
    precompiledPugPages = {};
}

function resetCachedRenderedPages() {
    cachedRenderedPages = {};
}

function reloadConfigurations() {

    currentTemplateName = fs.readFileSync(path.join(__dirname, "configurations", "template.txt"), "utf-8");
    console.log("Configs, current template:\t\t", currentTemplateName);
    var routerConfigurations = ini.parse(fs.readFileSync(path.join(__dirname, "configurations", "router.ini"), "utf-8"));

    // PUG
    pugCompilerOptions.pretty = routerConfigurations["pug"]["pretty"];
    console.log("Configs, pug pretty html:\t\t", pugCompilerOptions.pretty);

    // ROUTER
    renderTimeout = routerConfigurations["main"]["renderTimeout"];
    console.log("Configs, rendering timeout:\t\t", renderTimeout);
    bleedStacktraceAllowed = routerConfigurations["bleed"]["printStacktrace"];
    console.log("Configs, on bleed print stack:\t", bleedStacktraceAllowed);

}

module.exports = {
    prepare: function (callback) {
        reloadConfigurations();
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
    resetCachedRenderedPages: resetCachedRenderedPages,
    reloadConfigurations: reloadConfigurations
};