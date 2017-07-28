const Router = require('restify-router').Router,
      router = new Router()
      Promise = require('bluebird'),
      r = require('../database').r,
      errs = require('restify-errors');

router.get('/departments', Promise.coroutine(get));
router.get('/departments/:dep_prefix/employees', Promise.coroutine(getEmployees));
router.post('/departments', Promise.coroutine(create));
router.del('/departments/:dep_prefix', Promise.coroutine(remove));

function* get(req, res, next) {
    try{
        const departments = yield r.table('department').run();
        res.send(departments);
    }catch(err){
        return next(new errs.InternalServerError(err.message));
    }
    return next();
}

function* create(req, res, next){
    const {dep_prefix, name } = req.body;
    if(!(dep_prefix && name))
      return next(new errs.UnprocessableEntityError("Invalid request parameters"));
    try{
        const dep_id = yield r.table('department').filter({dep_prefix: dep_prefix})('id').limit(1).nth(0).default(null).run();
        if(dep_id){
          res.send(new errs.UnprocessableEntityError("Prefix already exists"));
        }
        else {
          const result = yield r.table('department')
                                .insert({
                                  dep_prefix,
                                  name,
                                  curr_count : 1
                                }, {returnChanges: true})
                                .do(function(doc){
                                  return r.branch(
                                        doc('inserted').ne(0),
                                        doc('changes')(0)('new_val'),
                                        new errs.InternalServerError("Department not inserted")
                                  )
                                }).run();
          res.send(result);
        }
    }catch(err){
      res.send(errs.InternalServerError(err.message))
    }
    return next();
}

function* getEmployees(req, res, next){
    const {dep_prefix} = req.params;
    try{
      const result = yield r.table('department').filter({dep_prefix: dep_prefix})('id').limit(1).nth(0).default([])
                            .do(function(dep_id){
                                return r.table('employee').getAll(dep_id, {index: 'department_id'})
                                  .concatMap(function(emp){
                                    return r.table('salary').getAll(emp('salary_id'), {index: 'id'})
                                            .map(function(salary){
                                              return { left: emp, right: salary }
                                            })
                                  }).zip()
                                  .map(function(row){
                                      return {
                                        employee_name : row('first_name').add(" ", row('last_name')),
                                        createdAt : row('createdAt'),
                                        age : row('age'),
                                        employee_num : row('emp_num'),
                                        salary: row('amount'),
                                        salary_grade: row('salary_grade')
                                      }
                                  })
                            }).run();
      res.send(result);
    }catch(err){
    }
    res.send(new errs.InternalServerError(err.message));
    return next();
}

function* remove(req, res, next){
    const {dep_prefix} = req.params;
    try{
      const department = yield r.table('department').filter({dep_prefix: dep_prefix}).limit(1).nth(0).default(null)
                                .do(function(doc){
                                  return r.branch(doc.eq(null),
                                          null,
                                          r.table('department').get(doc('id')).delete({returnChanges: true})
                                        )
                                }).run();
      if(!department)
        res.send("DEPARTMENT DOES NOT EXISTS");
      else if(department.deleted !== 0){
        const result  = yield r.table('employee').getAll(department.changes[0].old_val.id, {index: 'department_id'}).delete()
                                .do(function(doc){
                                  return r.expr(`${department.changes[0].old_val.name} department successfully and `)
                                          .add(doc('deleted').coerceTo('string')).add(' employee(s) successfully deleted')
                                }).run();
        res.send(result);
      } else res.send(new errs.InternalServerError("Department not successfully deleted"));
    }catch(err){
      res.send(new errs.InternalServerError(err.message));
    }
    return next();
}

module.exports = router;
