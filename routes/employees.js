const Router = require('restify-router').Router,
      router = new Router()
      Promise = require('bluebird'),
      r = require('../database').r,
      errs = require('restify-errors');

router.post('/employees', Promise.coroutine(create));
router.get('/employees', Promise.coroutine(get));
router.get('/employees/:emp_num', Promise.coroutine(getEmployee));
router.patch('/employees/:emp_num', Promise.coroutine(updateEmployee));
router.del('/employees/:emp_num', Promise.coroutine(deleteEmployee))

function* create(req, res, next) {
  const {age, salary_grade, dep_prefix, first_name, last_name} = req.body;
  if(!(age && first_name && last_name && salary_grade && dep_prefix))
    return next(new errs.UnprocessableEntityError("Invalid request parameters"));
  try {
      const [salary] = yield r.table('salary').filter({salary_grade}).limit(1).withFields('id').run();
      if(!salary)
        return next(new errs.UnprocessableEntityError("Invalid salary grade"));
      const [department] = yield r.table('department').filter({ dep_prefix: dep_prefix }).limit(1).withFields('id', 'curr_count').run();
      if(!department)
        return next(new errs.UnprocessableEntityError("Invalid department prefix"));
      let emp_suffix = `0000${department.curr_count}`;
      emp_suffix = emp_suffix.substr(emp_suffix.length-5);
      const result = yield r.table('employee').insert({
        age: parseInt(age),
        first_name,
        last_name,
        salary_id: salary.id,
        department_id: department.id,
        emp_num: `${dep_prefix}-${emp_suffix}`,
        createdAt: r.now()
      }, {returnChanges: true}).run();
      if(result.inserted !== 0){
        yield r.table("department").get(department.id)
                .update({
                  curr_count: r.row("curr_count").add(1)
                }).run();
        res.send(result.changes[0].new_val);
      } else res.send(new errs.InternalServerError("INSERTING AN EMPLOYEE FAILED"));
  }catch(err){
    return next(new errs.InternalServerError(err.message));
  }
  return next();
}

function* get(req, res, next){
    let {page, size, name, global_filter} = req.query;
    global_filter = (!global_filter) ? '' : global_filter.toLowerCase();
    name = (!name) ? '' : name.toLowerCase();
    if(size && !page)
      page = 1
    else if(!size){
      size = yield r.table('employee').count().run()
      page = 1
    }
    try{
        const result = yield r.table('employee')
                              .orderBy({index:'createdAt'})
                              .concatMap(function(emp){
                                return r.table('department').getAll(
                                  emp("department_id"),
                                  {index: 'id'}
                                ).map(function(department){
                                  return {left : emp, right : department}
                                })
                              })
                              .without({right: 'id', left: 'department_id'}).zip()
                              .concatMap(function(emp){
                                  return r.table("salary").getAll(
                                		emp("salary_id"),
                                		{ index:"id" }
                                	).map(function(salary) {
                                		return { left: emp, right: salary }
                                	})
                              })
                              .without({right: "id", left: "salary_id"}).zip()
                              .map({
                                  employee_name : r.row('first_name').add(" ", r.row('last_name')),
                                  createdAt : r.row('createdAt'),
                                  age : r.row('age').coerceTo('string'),
                                  employee_num : r.row('emp_num'),
                                  department: r.row('name'),
                                  salary: r.row('amount').coerceTo('string'),
                                  salary_grade: r.row('salary_grade')
                              })
                              .filter(r.row('employee_name').match(`(?i)${name}`))
                              .filter(r.row('employee_name').match(`(?i)${global_filter}`)
                                        .or(r.row('age').match(`(?i)${global_filter}`))
                                        .or(r.row('employee_num').match(`(?i)${global_filter}`))
                                        .or(r.row('department').match(`(?i)${global_filter}`))
                                        .or(r.row('salary_grade').match(`(?i)${global_filter}`))
                                        .or(r.row('salary').match(`(?i)${global_filter}`))
                              )
                              .slice((page - 1) * size, page * size)
                              .run();
        res.send(result);
    }catch(err){
        return next(new errs.InternalServerError(err.message));
    }
    return next();
}

function* getEmployee(req, res, next){
  const {emp_num} = req.params;
  try{
    const result = yield r.table('employee')
                          .getAll(emp_num, {index: 'emp_num'}).nth(0).default(null)
                          .do(function(doc){
                            return r.branch(doc.eq(null),
                                    null,
                                    doc.merge(
                                        r.table('salary').get(doc('salary_id')).pluck('amount', 'salary_grade'),
                                        r.table('department').get(doc('department_id')).pluck('name')
                                    )
                            )
                          }).run();
    if(!result)
      res.send(new errs.NotFoundError('Employee does not exists'))
    else{
      res.send({
        name: `${result.first_name} ${result.last_name}`,
        department: result.name,
        age : result.age,
        salary: result.amount,
        salary_grade: result.salary_grade,
        createdAt: result.createdAt
      });
    }
  }catch(err){
    res.send(new errs.InternalServerError(err.message));
  }
  return next();
}

function* updateEmployee(req, res, next){
  const {emp_num} = req.params;
  const {first_name, last_name, age} = req.body;
  if(!(first_name && last_name && age) || isNaN(age))
    return next(new errs.UnprocessableEntityError("Invalid request parameters"));
  try{
    const result = yield r.table('employee')
                          .getAll(emp_num, {index: 'emp_num'}).nth(0).default(null)
                          .do(function(doc){
                            return r.branch(doc.eq(null),
                                            null,
                                            r.table('employee').get(doc('id')).update({
                                              first_name,
                                              age: parseInt(age),
                                              first_name
                                            }, {returnChanges: true})
                            )
                          }).run();
    if(!result){
      res.send(new errs.NotFoundError("EMPLOYEE NUMBER does not exists"));
    } else if(result.unchanged === 0) {
      res.send(result.changes[0].new_val);
    } else res.send("Employee not updated");
  }catch(err){
      res.send(new errs.InternalServerError(err.message))
  }
  return next();
}

function* deleteEmployee(req, res, next){
  const {emp_num} = req.params;
  try{
    const result = yield r.table('employee').getAll(emp_num, {index: 'emp_num'}).nth(0).default(null)
                              .do(function(doc){
                                return r.branch(doc.eq(null),
                                        null,
                                        r.table('employee').get(doc('id')).delete({returnChanges: true})
                                      )
                              }).run();
    if(!result)
      res.send(new errs.NotFoundError("EMPLOYEE NUMBER does not exists"));
    else if(result.deleted == 0)
      res.send(new errs.InternalServerError("Failed to delete the employee"));
    else res.send(`EMPLOYEE with EMPLOYEE NUMBER ${result.changes[0].old_val.emp_num} successfully deleted`)
  }catch(err){
    res.send(new errs.InternalServerError(err.message))
  }
  return next();
}

module.exports = router;
