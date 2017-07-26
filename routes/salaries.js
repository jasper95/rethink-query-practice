const Router = require('restify-router').Router,
      router = new Router()
      Promise = require('bluebird'),
      r = require('../database').r,
      errs = require('restify-errors');


router.get('/salaries', Promise.coroutine(get));

function* get(req, res, next) {
    try{
        const salaries = yield r.table('salary').run();
        res.send(salaries);
    }catch(err){
        return next(new errs.InternalServerError(err.message));
    }
    return next();
}

module.exports = router;
