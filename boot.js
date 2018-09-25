var http = require('http');

// this was placed here in top, because some dependencied like "router" and "security"
// will not see module.exports if it be initialized after, theirs init.
module.exports = {
    getDB: function () {
        return db;
    },
    isConnected: function () {
        return db !== null;
    }
};

var router = require("./router.js"),
    security = require("./security.js");

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || "0.0.0.0",
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
        mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
        mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
        mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
        mongoPassword = process.env[mongoServiceName + '_PASSWORD'],
        mongoUser = process.env[mongoServiceName + '_USER'];
} else if (ip === "0.0.0.0") {
    console.log("App running on localhost: demo MongoDB connection data will be used!");
    var mongoHost = "localhost",
        mongoPort = "27017",
        mongoDatabase = "amsp";
}

var db = null,
    dbDetails = new Object();


var initDb = function(callback) {

    if (mongoHost && mongoPort && mongoDatabase) {
        mongoURLLabel = mongoURL = 'mongodb://';
        if (mongoUser && mongoPassword) {
            console.log("DB will be connected using login/password");
            mongoURL += mongoUser + ':' + mongoPassword + '@';
        } else {
            console.warn("DB connection will be established without login/password");
        }
        mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
    }

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

        console.log("Configs, DB connection url:\t\t", dbDetails.url);
        console.log("Configs, DB database name:\t\t", dbDetails.databaseName);
        console.log("Configs, DB type:\t\t\t\t", dbDetails.type);

        if (ip === "0.0.0.0") {
            console.log("Checking DB demo data...");

            return db.createCollection("sessions", null, function(error, createdSessionsCollection){
                if (error) {
                    return callback(error);
                }
                // TODO: make indexes
                db.createCollection("users", null, function(error, createdUsersCollection){
                    if (error) {
                        return callback(error);
                    }
                    createdUsersCollection.findOne({ username : "admin" }, { _id : 1 }, null, function(error, foundData){
                        if (error) {
                            return callback(error);
                        }
                        if (foundData) {
                            console.info("Demo-admin user is already exists!");
                            return callback(null);
                        } else {
                            createdUsersCollection.insertOne({
                                _id: "5f4dcc3b5aa765d61d8327deb882cf99",
                                email: "admin@example.org",
                                phone: 12345678901,
                                username: "admin",
                                password: "5f4dcc3b5aa765d61d8327deb882cf99",
                                accountCreated: new Date(),
                                passwordChanged: new Date(),
                                passwordChangesHistory: [],
                                loginHistory: [],
                                bannedTill: null,
                                bannedReason: null,
                                securityGrants: [],
                                securityRole: ["superadmin"],
                                personalDataUsageAgreed: new Date(),
                                accountActivated: new Date()
                            }, null, function(error, result){
                                if (!error) {
                                    console.info("Demo-admin user successfully created!");
                                } else {
                                    if(result.result.ok === 1) {
                                        console.warn("Can't create new demo-admin user!");
                                    } else {
                                        return callback(new Error("Unknown problem: db insert is non-ok"));
                                    }
                                }
                                callback(error);
                            });
                        }
                    });
                });
            });

        } else {
            callback(null);
        }

    });
};

console.info("App running with IP:\t\t\t", ip);
console.info("App running on PORT:\t\t\t", port);

var server;
console.log("Preparing router...");
router.prepare(function () {
    console.info("Router is ready.");
    console.log("Preparing security...");
    security.prepare(function () {
        console.info("Security is ready.");
        console.info("Initializing DB...");
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