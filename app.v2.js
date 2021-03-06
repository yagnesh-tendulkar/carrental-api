const passport = require("passport");
const passportJWT = require("passport-jwt");
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt
const express = require('express');
var cron = require('node-cron');
var notify = require("./app/v2/controllers/notify.js")

var app = express();

//controllers
var testController = require('./app/v2/controllers/test.controller.js');
var usersController = require('./app/v2/controllers/users.controller.js');
var kycController = require('./app/v2/controllers/kyc.controller.js');



//routers
var usersRouter = require('./app/v2/routes/users.routes.js');
var otpRouter = require('./app/v2/routes/otp.route.js');
var kycRouter = require('./app/v2/routes/kyc.route.js');
var carRouter = require("./app/v2/routes/cardetails.route")
cron.schedule("0 1 * * *", function () {
    notify.otpValidator()
    // console.log("running a task every 1 second");
});
const passportStrategy = new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'superSecret'
}, function (jwt_payload, next) {
    // usersController.findUser({ username: jwt_payload.username }).then(user => {
    next(null, "user");
    // }).catch((error) => {
    //     next(null, false);
    // });
});

//init passport strategy
passport.use(passportStrategy);

//handle browser options Request
function handleOptionsReq(req, res, next) {
    if (req.method === 'OPTIONS') { res.send(200) }
    else { next() }
}
const uploadFile = require("./app/v2/middlewares/upload");

//test routes
app.get('/test', testController.test);

app.get("/file/:id", async (req, res) => {
    console.log("/api/file/:id",req.params.id )
    try {
        const file = await gfs.files.findOne({ filename: req.params.id });
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    } catch (error) {
        res.send("not found");
    }
})

app.post("/api/file", uploadFile.single("file"), async (req, res) => {
    console.log("---------", req.body, req)
    if (req.file === undefined) return res.send("you must select a file.");
    const imgUrl = `${process.env.host}/${req.file.filename}`;
    res.send({ fileId: req.file.filename });
});

//unsecured application routes
app.post('/login', usersController.login);
app.post('/register', usersController.register);

//secured routes - auth using user JWT
app.use('/api', handleOptionsReq, passport.authenticate('jwt', { session: false }));
app.use('/api/users', usersRouter);
app.use('/otp', otpRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/car', carRouter);




module.exports = app;