const restify = require('restify'),
      config = require('./config'),
      db = require('./database'),
      employeesRoute = require('./routes/employees');

const server = restify.createServer();

server.pre(restify.plugins.pre.userAgentConnection());
server.use(restify.plugins.bodyParser());
//employeesRoute.applyRoutes(server);


db.createDatabase();
server.listen(config.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
