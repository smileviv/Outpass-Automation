// requiring dependencies

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


//setting up app

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));


//setting up passport

app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// Creating variables

let hostelname = " ";
var outpassarray = [];
var hosteloutpassarray = [];
let errors = [];
var today = new Date();
var currentdate = today.getDate();


//create database

mongoose.connect("mongodb://localhost:27017/Outpassdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


//creating student collections

const studentSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    username: {
        type: Number,
        required: true
    },
    password: String
});
studentSchema.plugin(passportLocalMongoose);
const Student = new mongoose.model("student", studentSchema);
passport.use(Student.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});


//creating warden collections

const wardenSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});
const Warden = new mongoose.model("warden", wardenSchema);


//creating outpass collections

const outpassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    id: {
        type: Number,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    bhawan: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    today: Number,
    place: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    status: String
});

const Outpass = new mongoose.model("outpass", outpassSchema);



//routes setup

//home route

app.get("/", function (req, res) {
    res.render("index");
    errors = [];
    //    var deleteoutpass = currentdate - 2;
    //    Outpass.deleteMany({
    //        today: deleteoutpass
    //    }, function (err) {
    //        if (err) {
    //            console.log(err);
    //        }
    //    });
});

//student credentials

//register route

app.get("/student/register", function (req, res) {
    res.render("studentregister", {
        errors: errors
    });
})

app.post("/student/register", function (req, res) {
    var name = req.body.name;
    var username = req.body.username;
    var password = req.body.password;
    errors = [];
    Student.register({
        username: username,
        name: name
    }, password, function (err, student) {

        if (err) {
            console.log(err);
            errors.push(err.message);
            res.redirect("/student/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/student/outpass");
            });
        }
    });
});


//login route

app.get("/student/login", function (req, res) {
    res.render("studentlogin", {
        errors: errors
    });
});

app.post("/student/login", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    errors = [];
    const student = new Student({
        username: username,
        password: password
    });
    studentid = req.body.username;
    req.login(student, function (err) {
        if (err) {
            errors.push(err);
            console.log(err.message);
            res.redirect("/student/login");
        } else {
            passport.authenticate("local")(req, res, function () {

                res.redirect("/student/outpass");

            });
        }
    });
});


//outpass route

app.get("/student/outpass", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("outpass");
    } else {
        res.redirect("/student/login");
    }
});

app.post("/student/outpass", function (req, res) {
    const outpass = new Outpass({
        name: req.body.sname,
        id: req.body.sid,
        year: req.body.syear,
        branch: req.body.sbranch,
        bhawan: req.body.sbhawan,
        from: req.body.sfrom,
        to: req.body.sto,
        date: req.body.sdate,
        today: currentdate,
        place: req.body.splace,
        purpose: req.body.spurpose,
        status: ""
    });

    Outpass.insertMany([outpass], function (err) {
        if (err) {
            console.log(err);

            res.redirect("/student/outpass")
        } else {
            res.redirect("/")
        }
    });

});


//warden credentials

//register route

app.get("/warden/register", function (req, res) {
    res.render("wardenregister", {
        errors: errors
    });
});

app.post("/warden/register", function (req, res) {
    var username = req.body.username;
    var id = req.body.staffid;
    var password = req.body.password;
    errors = [];
    bcrypt.hash(password, saltRounds, function (err, hash) {
        const warden = new Warden({
            username: username,
            id: id,
            password: hash
        });

        warden.save(function (err) {
            if (err) {
                console.log(err);
                errors.push(err.message);
                res.redirect("/warden/register");
            } else {
                hostelname = username;
                res.redirect("/hosteloutpass")
            }
        });
    });
});


//login route

app.get("/warden/login", function (req, res) {
    res.render("wardenlogin", {
        errors: errors
    });
});

app.post("/warden/login", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    errors = [];
    var id = req.body.id;
    Warden.findOne({
        id: id
    }, function (err, foundwarden) {
        if (err) {
            console.log(err);
        } else {
            if (foundwarden) {
                bcrypt.compare(password, foundwarden.password, function (err, result) {
                    if (err) {
                        console.log(err);
                        errors.push(err.message);
                    } else if (result === true) {
                        hostelname = username;
                        res.redirect("/hosteloutpass");

                    } else {
                        console.log("i dont know")
                    }
                });

            } else {
                console.log("user does not exists");
                res.redirect("/warden/register");
            }
        }
    });
});



//hostel outpass route

app.get("/hosteloutpass", function (req, res) {

    Outpass.find({
        bhawan: hostelname
    }, function (err, foundoutpasses) {
        if (err) {
            console.log(err);
        } else {
            foundoutpasses.forEach(function (foundoutpass) {
                if (foundoutpass.date.getDate() === currentdate || foundoutpass.date.getDate() === (currentdate + 1)) {
                    hosteloutpassarray.push(foundoutpass);
                }
            });
            console.log(hosteloutpassarray)
            res.render("hosteloutpass", {
                outpasses: hosteloutpassarray
            });

        }
    });
});

app.post("/hosteloutpass", function (req, res) {
    hosteloutpassarray = [];
    var sid = req.body.sid;
    Outpass.find({
        id: sid
    }, function (err, foundoutpasses) {
        if (err) {
            console.log(err);
        } else {
            console.log(foundoutpasses)
            foundoutpasses.forEach(function (foundoutpass) {

                if (foundoutpass.date.getDate() === currentdate || foundoutpass.date.getDate() === (currentdate + 1)) {
                    console.log(foundoutpass.date.getDate);
                    console.log(currentdate);
                    if (req.body.approved = "on") {
                        foundoutpass.status = "approved";
                        foundoutpass.save();
                        res.redirect("/hosteloutpass");
                    } else if (req.body.rejected = "on") {
                        Outpass.updateOne({
                            id: sid
                        }, {
                            status: "rejected"
                        }, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.redirect("/hosteloutpass");
                            }
                        })
                    } else {
                        console.log("error");
                    }
                }
            });
        }
    });
});

//check outpass status route

app.get("/checkoutpass", function (req, res) {
    res.render("checkoutpass", {
        outpasses: outpassarray
    });
});

app.post("/checkoutpass", function (req, res) {
    var username = req.body.username;
    outpassarray = [];
    //    Outpass.find({
    //        id: username
    //    }, function (err, foundoutpass) {
    //        if (err) {
    //            console.log(err);
    //        } else {
    //            if (foundoutpass) {
    //                console.log(foundoutpass[0].date);
    //                outpassarray = foundoutpass;
    //                res.redirect("/checkoutpass");    
    //            } else {
    //                res.redirect("/student/outpass");
    //            }
    //        }
    //    });

    Outpass.find({
        id: username
    }, function (err, foundoutpasses) {
        if (err) {
            console.log(err);
        } else {
            if (foundoutpasses) {
                console.log(foundoutpasses)
                foundoutpasses.forEach(function (foundoutpass) {
                    if (foundoutpass.date.getDate() == currentdate) {
                        outpassarray.push(foundoutpass);
                        res.redirect("/checkoutpass");
                    } else {
                        console.log("Error");
                        res.redirect("/outpass");
                    }
                })
            } else {
                res.redirect("/student/outpass");
            }
        }
    });

});



//listening to port 3000

app.listen(3000, function () {
    console.log("server started");
});
