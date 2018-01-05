var express = require('express');
var router = express.Router();
var processRequest = require('../routes/processRequest')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/loginAuth', processRequest.login);
router.post('/logout', processRequest.logout);
router.post('/user/session', processRequest.session);

module.exports = router;
