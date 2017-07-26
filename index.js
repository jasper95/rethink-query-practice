const restify = require('restify'),
      config = require('./config'),
      db = require('./database'),
      salariesRoutes = require('./routes/salaries'),
      employeesRoutes = require('./routes/employees'),
      departmentsRoutes = require('./routes/departments');

const server = restify.createServer();

server.pre(restify.plugins.pre.userAgentConnection());
server.use(restify.plugins.bodyParser());
salariesRoutes.applyRoutes(server);
employeesRoutes.applyRoutes(server);
departmentsRoutes.applyRoutes(server);


db.createDatabase();
server.listen(config.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
