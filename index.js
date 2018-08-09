//npm install express --save
//npm install body-parser
//npm install ejs
//npm install mongoose
const express = require('express');
const server = express();

var crypto = require('crypto');
var mykey = crypto.createCipher('aes-128-cbc', 'mypassword');

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
    shareuser: [ { type: String } ],
    
    
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
//   resp.render('./pages/home');
        postModel.find({}, function (err, post){
        const passData = { post:post };
        resp.render('./pages/home',{ data:passData });
    });
});

server.get('/create-post', function(req, resp){
   resp.render('./pages/createpost');       
});

server.get('/post', function(req, resp){
    resp.render('./pages/post');
});

server.get('/tags-result', function(req, resp){
//    var val = req.query.id;
    postModel.find({tags: {$regex: "test.*" }}, function (err, post){
        const passData = { post: post, variable: req.query.id };
        resp.render('./pages/all-posts', {data: passData});
    });
});

server.get('/viewbig', function(req, resp){
    var split = req.query.id.split(",");
    
    console.log("Picture: " +split[0]);
    console.log("Title: " +split[1]);
    
    const searchQuery = {title: split[1], picture: split[0]}
    
        postModel.findOne(searchQuery, function (err, post){
        if (post != undefined && post._id != null){
            const passData = { post: post };
            console.log("Id: " + post._id);
        }
            
        const passData = { post: post };
        resp.render('./pages/viewbig', {data: passData});
    });
})

server.post('/create-user', function(req, resp){
  const loginInstance = loginModel({
    user: req.body.user,
    pass: req.body.pass,
    picture: 'images/Blank.png'
  });
    
    loginInstance.pass = mykey.update(req.body.pass,'utf8','hex') + mykey.final('hex');
    
    
    console.log(loginInstance.pass);
  
  loginInstance.save(function (err, fluffy) {
    if(err) return console.error(err);
    const passData = { goodStatus: 1, msg:"User created successfully" };
    resp.render('./pages/resultregister',{ data:passData });
    
  });
});

server.post('/create-post', function(req, resp){
//    var allTags = req.body.tags.split(",");
//    for (var i=0;i<allTags.length;i++){
//        postInstance.tags[i] = allTags[i];
//    }
    
    const postInstance = postModel({
        title: req.body.title,
        tags: undefined,
        picture: req.body.picture,
        comments: undefined,
        likes: 0,
        timestamp: new Date(),
        privacy: req.body.privacy,
        shareuser: undefined
        
    });
    
    
    
    
    var Tags = req.body.tags;
    var allTags = Tags.split(",");
    
    for (var i=0;i<allTags.length;i++){
       postInstance.tags[i] = allTags[i]; 
        
       var queryResult = 0;
       const searchQuery = { body: postInstance.tags[i]}
       tagModel.findOne(searchQuery, function (err, tag) {
           if (err) return console.error(err);
           if (tag != undefined && tag._id != null)
               queryResult = 1;
       });
        
       if (queryResult === 0) {
           const tagInstance = tagModel({
               userID: undefined, //fix this
               body: postInstance.tags[i],
               timestamp: new Date(),
               parentPostID: postInstance._id

           });
           
           tagInstance.save(function (err,fluffy){
               if(err) return console.error(err);
           });
       }
    }
    
    var Share = req.body.shareuser;
    var allShare = Share.split(",");
    
    for (var j=0;j<allShare.length;j++)
        postInstance.shareuser[j] = allShare[j];
    
    
    
    
    postInstance.save(function (err, fluffy) {
        if (err) return console.error(err);
        resp.render('./pages/createpost',{});
    });
});

server.post('/read-user', function(req, resp){
//  const searchQuery = { user: req.body.user, pass: req.body.pass };
  const searchQuery = { user: req.body.user};  
  var queryResult = 0;
    
  

  loginModel.findOne(searchQuery, function (err, login) {
    if(err) return console.error(err);
    
    if(login != undefined && login._id != null)
//        queryResult = 1;
        var cipher = crypto.createDecipher('aes-128-cbc', 'mypassword');
        var decipheredPass = cipher.update(login.pass, 'hex', 'utf8') + cipher.final('utf8');
        if (req.body.pass === decipheredPass)
            queryResult = 1;
        console.log(decipheredPass);
        console.log("queryResult: " + queryResult)

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

server.post('/edit-profile', function(req, resp){
    const updateQuery = {
        user: req.body.user,
        pass: req.body.pass,
        };
    
    loginModel.findOne(updateQuery, function (err,login) {
//        login.user = req.body.user;
//        login.pass = req.body.pass;
        login.picture = req.body.picture;
        
        login.save(function (err, result) {
            if (err) return console.error(err);
            resp.render('./pages/home', {});
        });
    });
});

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

server.get('/tags', function(req, resp){
    
    tagModel.find({}, function (err, tag){
    const passData = { tag:tag };
    resp.render('./pages/tags', {data: passData});
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
