var database_uri = 'mongodb+srv://FCC_Practice:str8lucK1989!@freecodecamppractice.fe3ug.mongodb.net/FreeCodeCampPractice?retryWrites=true&w=majority'

var express = require('express');
var port = process.env.PORT || 3000
var app = express();
var mongo = require('mongodb');
var mongoose = require('mongoose');
var shortId = require('shortid');
var Schema = mongoose.Schema
var bodyParser = require('body-parser');


mongoose.connect(process.env.DB_URI)
mongoose.connect(database_uri, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
  serverSelectionTimeoutMS: 50000
});

// notifications to see if database connects
var connection = mongoose.connection;
connection.on("error", console.error.bind(console, "connection error:"));
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});

var cors = require('cors');
const { response } = require('express');
app.use(cors({optionsSuccessStatus: 200})); 


app.use(express.static('public'));


app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

app.get("/date", function (req, res) {
  res.sendFile(__dirname + '/views/date.html');
});

app.get("/requestHeaderParser", function (req, res) {
  res.sendFile(__dirname + '/views/requestHeaderParser.html');
});

app.get("/urlShortener", function (req, res) {
  res.sendFile(__dirname + '/views/urlShortener.html');
});

app.get("/exercise", function (req, res) {
  res.sendFile(__dirname + '/views/exercise.html');
});

// Exercise Tracker Project
let exerciseSessionSchema = new Schema({
  description: {type: String, required: true},
  duraction: {type: Number, required: true},
  date: String
})
let userSchema = Schema({
  username: {type: String, required: true},
  log: [exerciseSessionSchema]
})
let Session = mongoose.model('Session', exerciseSessionSchema)
let User = mongoose.model('User', userSchema)

app.post("/api/users", bodyParser.urlencoded({ extended: false}), (req, res) => {
  let newUser = new User({ username: req.body.username })
  newUser.save((err, savedUser) => {
    if(!err) {
      let responseObject = {}
      responseObject['username'] = savedUser.username
      responseObject['_id'] = savedUser.id
      res.json(responseObject)
    }
  })
})

app.get("/api/users", (req, res) => {
  User.find({}, (err, arrayOfUsers) => {
    if(!err) {
      res.json(arrayOfUsers)
    }
  })
})
app.post("api/users/:_id/exercises", bodyParser.urlencoded({ extended: false}), (req, res) => {
  let _id = req.body.id
  let newSession = new Session({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
  })
  if(newSession.date === '') {
    newSession.date = new Date().toISOString().substring(0,10)
  }
 
  User.findByIdAndUpdate(
    _id,
    // (res, req) => {
    //   if(!_id == "") {
    //     let updatedUrlId = __dirname + "api/users/" + _id + "/exercises";
    //     return res.redirect(updatedUrlId);
    //   }
    // },
    {$push : {log: newSession}},
    {new: true},
    (err, updatedUser) => {
      let responseObject = {}
      responseObject['_id'] = updatedUser._id
      responseObject['username'] = updatedUser.username
      responseObject['date'] = new Date(newSession.date).toDateString()
      responseObject['description'] = newSession.description
      responseObject['duration'] = newSession.duration
      res.json(responseObject)
    }
  )
    // let generatedId = req.body.id;
    // let updatedIdUrl = __dirname + "api/users/" + generatedId + "/exercises";
    // User.find({ id: generatedId}, (res, req) => {
    //   res.redirect(updatedIdUrl);
    // });
});


// Header Parser Project
app.get("/api/whoami", (req, res) => {
  res.json({
    "ipaddress": req.socket.remoteAddress,
    "language": req.headers["accept-language"],
    "software": req.headers["user-agent"],
    "host": req.headers["host"],
  });
})

// URL Shortener Project
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
var ShortURL = mongoose.model('ShortURL', new Schema({ 
  updated_url: String,
  original_url: String,
  short_url: String 
}));
function stringIsValidUrl(url) {

  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  return urlRegex.test(url);
}
app.post("/api/shorturl", (req, res) => { 

  let clientRequestedUrl = req.body.url;
  let short_url = shortId.generate();
  let newShortURL = short_url; 
  let newURL = new ShortURL({
    updated_url: __dirname + "/api/shorturl/" + short_url,
    original_url: clientRequestedUrl,
    short_url: short_url
  });
  if (stringIsValidUrl(clientRequestedUrl) == false) {
    return res.json({
      error: "invalid url"
    });
  }
  newURL.save((err, doc) => {
    if (err) return console.error(err);
    return res.json({
      "saved": true,
      "updated_url": newURL.updated_url,
      "original_url": newURL.original_url,
      "short_url": newURL.short_url
    });
  });
});
app.get("/api/shorturl/:short_url", (req, res) => {
  let userGeneratedUrl = req.params.short_url;
  ShortURL.find({short_url: userGeneratedUrl}).then(foundUrls => {
    let urlForRedirect = foundUrls[0];
    res.redirect(urlForRedirect.original_url);   
  });
});



// Timestamp Project
app.get("/api", (req, res) => {
  var now = new Date()
  res.json({
    "unix": now.getTime(),
    "utc": now.toUTCString()
  })
})

app.get("/api/:date", (req, res) => {
  let date_string = req.params.date;
  if (parseInt(date_string) > 10000) {
    let unixTime = new Date(parseInt(date_string));
    res.json({
      "unix": unixTime.getTime(),
      "utc": unixTime.toUTCString()
    });
  }
  let passedInValue = new Date(date_string);
  
  if (passedInValue.toString() == "Invalid Date") {
    res.json({ "error": "Invalid Date" });
  } else {
    res.json({
      "unix": passedInValue.getTime(),
      "utc": passedInValue.toUTCString()
    });
  }

});



var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

