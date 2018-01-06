var Mongoose = require('mongoose');
var db = require('../config/connectMongoose.js');
	
var productSchema =  new Mongoose.Schema ({
    name : { type : String, required : true, unique: true, index: true},
    description : { type : String},
    price : { type : String},
    category : {type: String},
    imageUrl : {type: String},
    select : {type: Object, default: {}},
    count : {type: Number, default: 0}
});

productSchema.index({name: 1}, {unique: true}); //combine key index
var product = db.model('product', productSchema); //put collection name here

module.exports = product;