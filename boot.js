var http = require('http'),
    fs = require('fs'),
    ini = require('ini');

console.info("Booting AMSP application");

console.log("Loading configs");
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
    if (mongoURL == null) return;

    var mongodb = require('mongodb');
    if (mongodb == null) return;

    mongodb.connect(mongoURL, function(err, conn) {
        if (err) {
            callback(err);
            return;
        }

        db = conn;
        dbDetails.databaseName = db.databaseName;
        dbDetails.url = mongoURLLabel;
        dbDetails.type = 'MongoDB';

        console.log('Connected to MongoDB at: %s', mongoURL);
    });
};

function echo(data, response) {
    response.end("Application is running!\nThis page viewed " + data.pageCountMessage + " times\n\nPORT: " + port + "\nIP: " + ip + "\nmongoURL: " + mongoURL + "\nmongoURLLabel: " + mongoURLLabel + "\nmongoServiceName: " + mongoServiceName + "\nmongoHost: " + mongoHost + "\nmongoPort: " + mongoPort + "\nmongoDatabase: " + mongoDatabase + "\nmongoPassword: " + mongoPassword + "\nmongoUser: " + mongoUser);
}

function handler (request, response) {
    console.log(request.url);

    if (!db) {
        initDb(function(err){});
    }
    if (db) {
        var col = db.collection('counts');
        // Create a document with request IP and current time of request
        col.insert({ip: request.ip, date: Date.now()});
        col.count(function(err, count){
            if (err) {
                console.log('Error running count. Message:\n'+err);
            }
            echo({pageCountMessage: count, dbInfo: dbDetails}, response);
        });
    } else {
        echo({pageCountMessage: null}, response);
    }
}

var server = http.createServer(handler).listen(port, ip);