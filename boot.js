var http = require('http'),
    router = require("./router.js");
security = require("./security.js");

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
        mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
        mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
        mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
        mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    var mongoUser = process.env[mongoServiceName + '_USER'];

    if (mongoHost && mongoPort && mongoDatabase) {
        mongoURLLabel = mongoURL = 'mongodb://';
        if (mongoUser && mongoPassword) {
            mongoURL += mongoUser + ':' + mongoPassword + '@';
        }
        mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
    }
}

var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
    if (mongoURL == null) return callback(new Error("Mongo URL is not specified!"));

    var mongodb = require('mongodb');
    if (mongodb == null) return callback(new Error("Mongo module is not connected!"));

    return mongodb.connect(mongoURL, function (err, conn) {
        if (err) {
            callback(err);
            return;
        }

        db = conn;
        dbDetails.databaseName = db.databaseName;
        dbDetails.url = mongoURLLabel;
        dbDetails.type = 'MongoDB';

        callback(null);
    });
};

console.log("IP:\t\t\t", ip);
console.log("Port:\t\t", port);
console.log("Mongo URL:\t", mongoURL);

var server;
console.log("Preparing router...");
router.prepare(function () {
    console.info("Router is ready.");
    console.log("Preparing security...");
    security.prepare(function () {
        console.info("Security is ready.");
        initDb(function (err) {
            if (err) {
                console.error("Can't establish connection to DB");
            } else {
                console.info("DB connected.");
            }
            console.log("Running http server...");
            server = http.createServer(function (request, response) {
                var timeStart = new Date().getTime();
                console.log();
                /* TODO: capture some logs & statistics */
                router.route(request, response);
                console.log("Page rendered in " + ((new Date().getTime()) - timeStart) + "ms");
            }).listen(port, ip);
        });
    });
});

module.exports = {
    getDB: function () {
        return db;
    },
    isDBConnected: function () {
        return db !== null;
    }
};