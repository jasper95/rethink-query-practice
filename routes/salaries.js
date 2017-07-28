const Router = require('restify-router').Router,
      router = new Router()
      Promise = require('bluebird'),
      r = require('../database').r,
      errs = require('restify-errors');


router.get('/salaries', Promise.coroutine(get));
router.patch('/salaries/:grade', Promise.coroutine(update));
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
                                            .ungroup()
                                            .orderBy('reduction')
                                            .map({
                                              department: r.row('group'),
                                              avg_salary: r.row('reduction')
                                            })
                                            .run();
    res.send(result);
  }catch(err){
    return next(new errs.InternalServerError(err.message));
  }
  return next();
}

function* update(req, res, next){
    const { amount } = req.body;
    const { grade } = req.params;
    if(!grade)
      return next(new errs.BadRequestError("Invalid request body"));
    try{
      const result = yield r.table('salary').filter({salary_grade: grade}).limit(1).nth(0).default(null)
                                .do(function(doc){
                                  return r.branch(doc.eq(null),
                                          null,
                                          r.table('salary').get(doc('id')).update({amount}, {returnChanges: true})
                                        )
                                }).run();
      if(!result){
        res.send(new errs.NotFoundError("SALARY GRADE does not exists"));
      } else if(result.unchanged == 0) {
        res.send(result.changes[0].new_val);
      } else res.send("Salary not updated")
    }catch(err){
      res.send(new errs.InternalServerError(err.message));
    }
    return next();
}

module.exports = router;
