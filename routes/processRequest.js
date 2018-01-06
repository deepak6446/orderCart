const User 			= require('../models/users.js')
const Product 		= require('../models/product.js')
const Order  		= require('../models/order.js')
const setting 		= require('../config/setting')
const Q 			= require('q')
const crypto 		= require('crypto');

const algorithm 	= setting.algorithm, 
	  password 		= setting.password,
	  client		= setting.client 

module.exports 	= {

	getProducts : (req, res) => {
		Product.find({}, (err, data) => {
			console.log("product", err, data)
			json = {}
			if(err||!data.length) json = { status:false, message: "Error Getting Product's"}
			else json = { status:true, data: data}

			res.send(json)
			res.end()
		})
	},

	loadOrders : (req, res) => {
		Order.find({username: req.session.username}, (err, data) => {
			// console.log("product", err, data)
			json = {}
			if(err||!data.length) json = { status:false, message: "No products ordered"}
			else json = { status:true, data: data}

			res.send(json)
			res.end()
		})
	},

	placeOrder : (req, res) => {
		console.log("placeOrder", req.body)
		req.body.forEach(function(d) {
			Product.update({_id:d._id}, {$inc:{count:-d.count}}, function(e, d) {
				console.log('in svae product', e, d)
			})
			delete d['_id']
			console.log('-------', d)
			order = new Order(d)
			order.username = req.session.username
			order.save(function(er, da) {console.log("inn save", er, da)})
		})
		res.send({status:true})
		res.end()
	},

	login: async (req, res) => {
	    
	    console.log("<<<<<<<<<<<<< in login : ", req.body)

	    var username = req.body.username || '';
	    var password = req.body.password || '';

	    if (username == '' || password == '') {
	        res.json({
	            "status": false,
	            "message": "Invalid credentials"
	        });
	        return;
	    }
	    
	    var dbUserObj = await module.exports.validate(username, password)
	    
        console.log("in auth.validate", dbUserObj)

        if (!dbUserObj) { // If authentication fails, we send a 401 back
            
            res.json({
                "status": false,
                "message": "Invalid credentials!"
            });

        }else {

            try {
                req.session.username = dbUserObj.username;
                res.json(dbUserObj);
                res.end();                    
            }catch (e) {
                console.log("err in login", e)
                res.json({
                    "status": false,
                    "message": "Error login please try again"
                });
            }

        }

	},

	logout: async (req, res) => {
	    var username = req.session.username
	    
	    try {
		    if (username && user_sessions[username]) {
		    	delete user_sessions[username]
		    	req.session.destroy()
	    	    res.json({status: true});
	    	    res.end();	
		    }
	    } catch(e) {
    	    console.log('Raise exception: '+e)
    	    res.json({status: false, message: 'Something went wrong.'})
    	    res.end();
    	}

	},

	validate: (username, password) => {
	    console.log("in validate")
	    var deferred = Q.defer();
	    console.log("2 in validate", username)

	    try{
	    console.log("3 in validate", username)

	        User.findOne({username: username}, (err, doc) => {
	        	console.log(err, doc)
	    console.log("4 in validate", username)

	            if (err) reject(err);
	            else {
	                if (!doc)
	                    return deferred.resolve(false);
	                console.log("----------->", doc, decrypt(doc.password), password)
	                if (decrypt(doc.password) !== password)
	                    deferred.resolve(false);
	                else {
	                    user_sessions[doc.username] = {
	                        username: doc.username,
	                        password: doc.password
	                    }

	                    deferred.resolve({
	                        status: true, 
	                        username: doc.username,
	                    });
	                }
	            }
	        })
	    console.log("5 in validate", username)

	    }catch (e) {
	        console.log('Raise exception: '+e)
	        return deferred.resolve(false);
	    }
	    return deferred.promise;
	},

	session: (req, res) => {
	    console.log('-seession-----------------')
	    var username = req.session.username || req.body.username;
	    status = {status: username ? true : false, userInfo: {username:req.session.username}}
	    console.log("--------------__________>session", status)
	    res.json(status);
	    res.end();

	},
}

validateEmail = (email) => {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    return re.test(email);
}

encrypt = (text) => {
	if (!text||!text.length) return '';
  	var cipher = crypto.createCipher(algorithm,password)
  	var crypted = cipher.update(text,'utf8','hex')
  	crypted += cipher.final('hex');
  
  	return crypted;
}


decrypt = (text) => {
  	if (!text||!text.length) return '';
  	try {
		
		var decipher = crypto.createDecipher(algorithm,password)
	  	var dec = decipher.update(text,'hex','utf8')
	  	dec += decipher.final('utf8');

  	}catch (e) {
    	console.log("err in decrypt", e)
  	}

  	return dec;
}