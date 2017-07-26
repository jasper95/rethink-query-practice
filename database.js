const config = require('./config'),
      r = require('rethinkdbdash')(config.rethinkdb),
      Promise = require('bluebird');

module.exports.createDatabase = function(){
  Promise.coroutine(function*(){
    try{
      yield r.dbCreate(config.rethinkdb.db).run();
      yield r.db(config.rethinkdb.db).tableCreate("employee").run();
      yield r.db(config.rethinkdb.db).table("employee").indexCreate("salary_id").run();
      yield r.db(config.rethinkdb.db).table("employee").indexCreate("department_id").run();
      yield r.db(config.rethinkdb.db).tableCreate("department").run();
      yield r.db(config.rethinkdb.db).table("department").insert([
         {
             dep_prefix: "01",
             name: "Developers",
             curr_count: 1
         },
         {
             dep_prefix: "02",
             name: "Marketing",
             curr_count: 1
         },
         {
             dep_prefix: "03",
             name: "Research and Development",
             curr_count: 1
         }
      ]).run();
      yield r.db(config.rethinkdb.db).tableCreate("salary").run();
      yield r.db(config.rethinkdb.db).table("salary").insert([
          {
              salary_grade: "A",
              amount: 40000
          },
          {
              salary_grade: "B",
              amount: 30000
          },
          {
              salary_grade: "C",
              amount: 20000
          },
          {
              salary_grade: "D",
              amount: 15000
          }
      ]).run();
    }catch (err) {

    }
  })();
}
module.exports.r = r
