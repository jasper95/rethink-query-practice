const Router = require('restify-router').Router,
      router = new Router()
      Promise = require('bluebird'),
      r = require('../database').r,
      errs = require('restify-errors');

router.get('/departments', Promise.coroutine(get));

function* get(req, res, next) {
    try{
        const departments = yield r.table('department').run();
        res.send(departments);
    }catch(err){
        return next(new errs.InternalServerError(err.message));
    }
    return next();
}

module.exports = router;
