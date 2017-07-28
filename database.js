const config = require('./config'),
      r = require('rethinkdbdash')(config.rethinkdb),
      Promise = require('bluebird');

module.exports.createDatabase = function(){
  return Promise.coroutine(function*(){
    const dbName = config.rethinkdb.db;
    try{
      yield r.dbCreate(dbName).run();
      yield r.tableCreate("employee").run();
      yield r.table("employee").indexCreate("full_name", [r.row("last_name"), r.row("first_name")]);
      yield r.table("employee").indexCreate("salary_id").run();
      yield r.table("employee").indexCreate("department_id").run();
      yield r.table("employee").indexCreate("createdAt").run();
      yield r.table('employee').indexWait().run();
      yield r.tableCreate("department").run();
      yield r.table("department").insert([
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
      console.log("DATABASE READY");
    }catch (err) {
      console.log("DATABASE ALREADY CREATED");
    }
  })();
}
module.exports.r = r
