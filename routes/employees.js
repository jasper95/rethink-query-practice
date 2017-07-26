const Router = require('restify-router').Router,
      router = new Router()
      Promise = require('bluebird'),
      r = require('../database').r,
      errs = require('restify-errors');

router.post('/employees', Promise.coroutine(create));
router.get('/employees', Promise.coroutine(get));

function* create(req, res, next) {
  const {age, name, salary_grade, dep_prefix} = req.body;
  if(!(age && name && salary_grade && dep_prefix))
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
        name,
        salary_id: salary.id,
        department_id: department.id,
        emp_num: `${dep_prefix}-${emp_suffix}`,
      }, {returnChanges: true}).run();
      yield r.table("department").get(department.id)
              .update({
                curr_count: r.row("curr_count").add(1)
              }).run();
      res.send(result.changes[0].new_val);
  }catch(err){
    return next(new errs.InternalServerError(err.message));
  }
  return next();
}

function* get(req, res, next){
    try{
        const result = yield r.table('employee').eqJoin('department_id', r.table('department'), {index: 'id'})
                                              .map({
                                                  employee_name : r.row('left')('name'),
                                                  age : r.row('left')('age'),
                                                  employee_num : r.row('left')('emp_num'),
                                                  department: r.row('right')('name'),
                                                  salary_id : r.row('left')('salary_id')
                                              })
                                              .eqJoin('salary_id', r.table('salary'), {index: 'id'})
                                              .without({right: "id", left: "salary_id"})
                                              .zip()
                                              .run();
        res.send(result);
    }catch(err){
        return next(new errs.InternalServerError(err.message));
    }
    return next();
}

module.exports = router;
