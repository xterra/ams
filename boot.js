'use strict';

const http = require('http');

// this was placed here in top,
// because some dependencied like "router" and "security"
// will not see module.exports if it be initialized after, theirs init.

const router = require('./router.js'),
  security = require('./security.js'),
  dbConnect = require('./dbConnect.js');

const localIP =  '0.0.0.0',
  port = process.env.PORT || 8080,
  ip = process.env.IP || localIP;

console.info('App running with IP:\t\t\t', ip);
console.info('App running on PORT:\t\t\t', port);

let server;
console.log('Preparing router...');
router.prepare(() => {
  console.info('Router is ready.');
  console.log('Preparing security...');
  security.prepare(() => {
    console.info('Security is ready.');
    console.info('Initializing DB...');
    dbConnect.initDb(err => {
      if (err) {
        console.error('Can\'t establish connection to DB');
      } else {
        console.info('DB connected.');
      }
      console.log('Running http server...');
      server = http.createServer((request, response) => {
        const timeStart = new Date().getTime();
        /* TODO: capture some logs & statistics */
        router.route(request, response);
        console.log(`Page rendered in ${((new Date().getTime()) - timeStart)} ms`);
      }).listen(port, ip);
    });
  });
});
