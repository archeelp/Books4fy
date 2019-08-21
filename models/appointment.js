var mongoose =require("mongoose");
var appointmentSchema = new mongoose.Schema({
    syname : String,
    fyname : String,
    sycn : String,
    fycn : String,
    time : String,
    description : String,
    bookprice : String,
    bidprice: String,
    bookingdate: {type: Date, default: Date.now},
    syid:
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "user"
        },
    fyid:
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "user"
        }
});
module.exports=mongoose.model("appointment", appointmentSchema);