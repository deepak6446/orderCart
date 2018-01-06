var Mongoose = require('mongoose');
var db = require('../config/connectMongoose.js');
	
var orderSchema =  new Mongoose.Schema ({
    name : { type : String, index: true},
    description : { type : String},
    price : { type : String},
    category : {type: String},
    imageUrl : {type: String},
    select : {type: Object, default: {}},
    count : {type: Number, default: 0},
    username : {type:String}
});

orderSchema.index({name: 1}, {unique: true}); //combine key index
var order = db.model('order', orderSchema); //put collection name here

module.exports = order;