//npm install express --save
//npm install body-parser
//npm install ejs
//npm install mongoose
const express = require('express');
const server = express();

//Require a MongoDB connection using mongoose. Include the mongoose library
//and feed it the correct url to run MongoDB.
//URL is the database it connects to.
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/logindb');

const bodyParser = require('body-parser')
server.use(express.json()); 
server.use(express.urlencoded({ extended: true }));

server.use(express.static('public'));

server.set('view engine', 'ejs');

const loginSchema = new mongoose.Schema({
  user: { type: String },
  pass: { type: String },
  picture: { type: String },
    
},{ versionKey: false });

const loginModel = mongoose.model('login', loginSchema);

const postSchema = new mongoose.Schema({
    title: { type: String },
    tags: [ { type: String } ],
    picture: { type: String },
    comments: [ { type: String } ],
    likes: { type: Number },
    timestamp: { type: String },
    privacy: { type: String },
    
    
},{ versionKey: false });

const postModel = mongoose.model('post', postSchema);

const tagSchema = new mongoose.Schema({
    userID: { type: String },
    body: { type: String },
    timestamp: { type: String },
    parentPostID: {type: String },
    
},{ versionKey: false });

const tagModel = mongoose.model('tag', tagSchema);
 

server.get('/', function(req, resp){
   resp.render('./pages/home');
});

server.get('/create-post', function(req, resp){
   resp.render('./pages/createpost');       
});

server.get('/post', function(req, resp){
    resp.render('./pages/post');
});

server.post('/create-user', function(req, resp){
  const loginInstance = loginModel({
    user: req.body.user,
    pass: req.body.pass
  });
  
  loginInstance.save(function (err, fluffy) {
    if(err) return console.error(err);
    const passData = { goodStatus: 1, msg:"User created successfully" };
    resp.render('./pages/resultregister',{ data:passData });
    
  });
});

server.post('/new-post', function(req, resp){
    const postInstance = postModel({
        title: req.body.title,
        tags: undefined,
        picture: req.body.picture,
        comments: undefined,
        likes: 0,
        timestamp: new Date(),
        privacy: req.body.privacy
        
    });
    
    postInstance.save(function (err, fluffy) {
        if (err) return console.error(err);
        resp.render('./pages/createpost',{});
    });
});

server.post('/read-user', function(req, resp){
  const searchQuery = { user: req.body.user, pass: req.body.pass };
  var queryResult = 0;

  loginModel.findOne(searchQuery, function (err, login) {
    if(err) return console.error(err);
    
    if(login != undefined && login._id != null)
        queryResult = 1;

      var strMsg;
      if(queryResult === 1)strMsg = "User-name and password match!";
      else strMsg = "User-name and password do not match!";
      const passData = { goodStatus: queryResult, msg:strMsg };
      resp.render('./pages/resultlogin',{ data:passData });
  });
});

//server.post('/update-user', function(req, resp){
//  const updateQuery = { user: req.body.user };
//
//  loginModel.findOne(updateQuery, function (err, login) {
//    login.pass = req.body.pass;
//    login.save(function (err, result) {
//      if (err) return console.error(err);
//      const passData = { goodStatus: 1, msg:"User updated successfully if exists!" };
//      resp.render('./pages/result',{ data:passData });
//    });
//  });
//});

server.get('/view-all',function(req, resp){
    
    loginModel.find({}, function (err, login){
        const passData = { login:login };
        resp.render('./pages/all',{ data:passData });
    });
    
});

server.get('/all-posts', function(req, resp){
    
    postModel.find({}, function (err, post){
        const passData = {post:post};
        resp.render('./pages/all-posts', {data:passData});
    });
});

server.get('/login', function(req, resp){
        resp.render('./pages/login', {});   
    });

server.get('/register', function(req, resp){
    resp.render('./pages/register', {});
});


server.get('/view-test',function(req, resp){
    //https://stackoverflow.com/questions/43729199/how-i-can-use-like-operator-on-mongoose
    loginModel.find({user: { $regex: 'test.*' }}, function (err, login){
        const passData = { login:login };
        resp.render('./pages/all',{ data:passData });
    });
    
});

const port = process.env.PORT | 9090;
server.listen(port);
