const Router = require('restify-router').Router,
      router = new Router()
      Promise = require('bluebird'),
      r = require('../database').r,
      errs = require('restify-errors');


router.get('/salaries', Promise.coroutine(get));
router.get('/salaries/avg', Promise.coroutine(avgSalary));

function* get(req, res, next) {
    try{
        const salaries = yield r.table('salary').run();
        res.send(salaries);
    }catch(err){
        return next(new errs.InternalServerError(err.message));
    }
    return next();
}

function* avgSalary(req, res, next){
  try{
    const result = yield r.table('employee').withFields('salary_id', 'department_id')
                                            .eqJoin('salary_id', r.table('salary'), {index: "id"}).zip()
                                            .eqJoin('department_id', r.table('department'), {index: "id"}).zip()
                                            .group('name')
                                            .avg('amount')
                                            .default(null)
                                            .run();
    res.send(result.map(function(val){
      return {
        department: val.group,
        avg_salary: val.reduction
      }
    }));
  }catch(err){
    return next(new errs.InternalServerError(err.message));
  }
  return next();
}

module.exports = router;
