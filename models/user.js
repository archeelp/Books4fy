var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    type : String,
    status : String,
    signupdate: {type: Date, default: Date.now},
    username: String,
    password: String,
    name :String,
    contactnumber: String,
    description : String,
    bookprice:String,
    appointments: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "appointment"
        }
     ]
});

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("user", userSchema);