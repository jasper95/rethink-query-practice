const config = require('./config'),
      r = require('rethinkdbdash')(config.rethinkdb),
      Promise = require('bluebird');

module.exports.createDatabase = function(){
  Promise.coroutine(function*(){
    try{
      yield r.dbCreate(config.rethinkdb.db).run();
      yield r.db(config.rethinkdb.db).tableCreate("employee").run();
      yield r.db(config.rethinkdb.db).tableCreate("department").run();
      yield r.db(config.rethinkdb.db).tableCreate("salary").run();
    }catch (err) {

    }
  })();
}
module.exports.r = r
