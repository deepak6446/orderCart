const 	express 	  = require('express'),
    		path 		    = require('path'),
     		favicon 	  = require('serve-favicon'),
     		logger 		  = require('morgan'),
     		cookieParser= require('cookie-parser'),
     		bodyParser 	= require('body-parser'),
     		session 	  = require('express-session'),
     		users 		  = require('./routes/users'),
     		routes 		  = require('./routes/index'),
     		settings 	  = require('./config/setting');


var app = express();
global.user_sessions = {};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(session({ secret: 'orderCartSessionSec00000', cookie: {  }})) //1 hr max age
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('uncaughtException', function(e) {
 console.log("uncaughtException: Node NOT Exiting..."+e);
});

module.exports = app;
