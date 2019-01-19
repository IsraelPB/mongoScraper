var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var PORT = 3000;
var db =require("./models");
mongoose.connect("mongodb://localhost/mongoScraper", { useNewUrlParser: true });
var exphbs = require('express-handlebars');
var app = express();
var path = require("path");
var mongo = require("mongodb");
var bodyParser = require("body-parser");
 
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.set('views',path.join(__dirname, 'views'));
app.engine('hbs', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'hbs');


app.get('/', function(req, res){
    res.render('home');
});

 
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });