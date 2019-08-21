var express					= require("express"),
    app 					= express(),
	bodyParser 				= require("body-parser"),
	session 				= require("express-session"),
	mongoose 				= require("mongoose"),
	expressSanitizer 		= require("express-sanitizer"),
	passport 				= require("passport"),
	LocalStrategy 			= require("passport-local"),
	passportLocalMongoose 	= require("passport-local-mongoose"),
    user 				  	= require("./models/user"),
	appointment				= require("./models/appointment"),
	feedback 				= require("./models/feedback"),    
	flash       			= require("connect-flash"),
	databaseURL 			= process.env.DATABASEURL || 'mongodb://localhost/books';
	secret=process.env.SECRET||"We are bookexchange devlopers";

mongoose.connect(databaseURL, { useNewUrlParser: true });
app.use(express.static('pubic'));
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");
app.use(expressSanitizer());
app.use(flash());

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "We are clinicapp devlopers",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use("user",new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentuser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.warning = req.flash("warning");
    res.locals.info = req.flash("success");
    next();
    });

app.get("/",function(req,res){
		res.render("homepage");
});

app.get("/about", function(req, res) {
	res.render("about");
});

app.get("/adddetails",isLoggedIn,issy,function(req,res){
    res.render("adddetails");
})

app.get("/end",isLoggedIn,issy,function(req,res){
    res.render("end");
})

app.post("/end",isLoggedIn,issy, function(req, res) {
    user.findById(req.user._id,function(err,sy){
        if(err){
            req.flash("error","An Error Occured!! Please Try Again Later");
            res.redirect("back");
        }
        else{
            sy.status = "out of stock";
            sy.save();
            req.flash("info","Books gone out of stock");
            res.redirect("/books");
        }
    });	
});

app.post("/adddetails",isLoggedIn,issy,nobookdes, function(req, res) {
			user.findById(req.user._id,function(err,sy){
                if(err){
                    req.flash("error","An Error Occured!! Please Try Again Later");
				    res.redirect("back");
                }
                else{
                    sy.description = req.sanitize(req.body.description);
                    sy.bookprice = req.sanitize(req.body.bookprice);
                    sy.status = "in stock";
                    sy.save();
                    req.flash("success","Details Added Successfully");
                    res.redirect("/books");
                }
            });	
});

app.get("/signin",nouser,function(req,res){
    res.render("signin");
});

app.get("/signup",nouser,function(req,res){
    res.render("signup");
});

app.get("/feedback", isLoggedIn, function(req, res) {
	res.render("feedback");
});

app.get("/requests",isLoggedIn,isfy,function(req,res){
    user.findById(req.user._id).populate("appointments").exec(function(err, foundfy){
        if(err||!foundfy){
            req.flash("error","Sorry!! An error occured");
			res.redirect("back");
        } else {
            res.render("requests", {fy: foundfy});
        }
    });
})

app.get("/srequests",isLoggedIn,issy,function(req,res){
    user.findById(req.user._id).populate("appointments").exec(function(err, foundsy){
        if(err||!foundsy){
            req.flash("error","Sorry!! An error occured");
			res.redirect("back");
        } else {
            res.render("srequests", {sy: foundsy});
        }
    });
})

app.post("/feedback",isLoggedIn, function(req, res) {
	var fb=req.sanitize(req.body.feedback.feedback),
	un=req.sanitize(req.body.feedback.name);
	feedback.create({feedback:fb,username:un}, function(err, newfeedback) {
		if(err||!newfeedback) {
			req.flash("error","An error occured while submittng your feedback please try again later");
			res.redirect("back");
		}
		else {
			req.flash("success","Feedback submitted successfully ");
		}
	});
	res.redirect("/");
});

app.get("/admin",isLoggedIn,isadmin,function(req,res){
	feedback.find({}, function(err, allfeedbacks){
		if(err||!allfeedbacks){
			req.flash("info","No feedback found");
			res.redirect("/");
		} else {
		   res.render("admin",{feedbacks:allfeedbacks});
		}
	 });
});

app.get("/logout",isLoggedIn,function(req,res){
	req.logout();
	req.flash("success","Logged Out Successfully");
	res.redirect("/");
});

app.post("/signup",function(req,res){
	var suser = {
		username: req.sanitize(req.body.username),
		type: req.body.type,
		name: req.sanitize(req.body.name),
		contactnumber: req.sanitize(req.body.contactnumber)
	};
    user.register(suser, req.body.password ,function(err, newlyCreated){
        if(err||!newlyCreated){
			req.flash("error","A User With That Username Already Exists");
			return res.render("signup");
		}
		passport.authenticate("user")(req, res, function(){
			req.flash("success","Sign Up Successful");
			res.redirect("/");
		});
    });
});

app.get("/books",function(req,res){
	//
	var noMatch = false;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all users from DB
        user.find({name: regex}, function(err, allsys){
           if(err){
               console.log(err);
           } else {
              if(allsys.length < 1) {
                  noMatch = true;
              }
              res.render("books",{sys:allsys, noMatch: noMatch});
           }
        });
    } else {
        // Get all users from DB
        user.find({}, function(err, allsys){
           if(err){
               console.log(err);
           } else {
              res.render("books",{sys:allsys, noMatch: noMatch});
           }
        });
    }
});

app.get("/books/:id", function(req, res){
	user.findById(req.params.id,function(err, sy){
        if(err||!sy){
            console.log(err);
        } else {
			res.render("show", {sy: sy});
        }
    });
});

app.get("/books/:id/interested",isLoggedIn,isfy, function(req, res){
    user.findById(req.params.id, function(err, sy){
    if(err||!sy){
        req.flash("error","An Error Occured!! Please Try Again");
        res.redirect("back");
    } else {
         res.render("interested", {sy: sy});
    }
})
});

app.post("/books/:id/interested",isLoggedIn,isfy, function(req, res){
user.findById(req.params.id, function(err, sy){
    if(err||!sy){
        req.flash("error","An Error Occured!! Please Try Again");
        res.redirect("back");
    } else {
     appointment.create(
         {
            fyname : req.user.name,
            syname : sy.name,
            fycn : req.user.contactnumber,
            sycn : sy.contactnumber,
            syid : sy._id,
            fyid : req.user._id,
            bookprice : sy.bookprice,
            bidprice : req.body.bidprice
            }, function(err, appointment){
        if(err||!appointment){
            req.flash("error","An Error Occured!! Please Try Again");
            res.redirect("back");
        } else {
            appointment.save();
            sy.appointments.push(appointment);
            sy.save();
            req.user.appointments.push(appointment);
            req.user.save();
            req.flash("success","We have notified to "+sy.name+" about your interest in buying his book.\nHe will contact you through number you provided");
            res.redirect("/");
        }
     });
    }
});
});

app.post("/signin",nouser, passport.authenticate("user", 
{
 successRedirect: "/",
 failureRedirect: "/signin"
}), function(req, res){
});

app.get("/*", function(req, res){
	req.flash("error","Error 404! The page you are looking for is not found.");
	res.redirect("/");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
	}
	req.flash("error","You Need To Login To Perform That");
    res.redirect("/signin");
}

function nouser(req, res, next){
    if(!req.user){
        return next();
	}
	req.flash("error","You Need To Log Out First");
    res.redirect("back");
}

function issy(req, res, next){
		if(req.user.type=="sy"){
        return next();
	}
	req.flash("info","Only sys Can Access That Page");
    res.redirect("back");
}

function nobookdes(req, res, next){
		if(req.user.type=="sy"&&!req.user.description){
        return next();
	}
	req.flash("info","You Already Have Filled Description");
    res.redirect("back");
}

function isfy(req, res, next){
		if(req.user.type=="fy"){
		return next();
	}
	req.flash("info","Only sys Can Access That Page");
    res.redirect("back");
}

function isadmin(req, res, next){
	if(req.user.type=="admin"){
	return next();
}
req.flash("info","Only Admins Can Access That Page");
res.redirect("back");
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

app.listen(process.env.PORT||3000, function(){
	console.log("The bookexchange Server Has Started!");
 })