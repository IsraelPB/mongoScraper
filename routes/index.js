var express = require("express");
var router = express.Router();
var Article = require("../models/article");
var Comment = require("../models/comment");
var axios = require("axios");
var cheerio = require("cheerio");

router.get("/", function(req, res, next) {
  Article.find({})
    .sort([["scrapedAt", -1]])
    .exec(function(err, docs) {
      var totalArticles = docs.length;
      var articleChunks = [];
      var chunkSize = 3;
      for (var i = 0; i < docs.length; i += chunkSize) {
        articleChunks.push(docs.slice(i, i + chunkSize));
      }

      res.render("shop/index", {
        title: "mongoScraper",
        articles: articleChunks,
        qty: totalArticles
      });
    });
});

router.get("/saved", function(req, res, next) {
  Article.find({ isSaved: true })
    .sort([["scrapedAt", -1]])
    .exec(function(err, docs) {
      var totalSavedArticles = docs.length;
      var articleChunks = [];
      var chunkSize = 3;
      for (var i = 0; i < docs.length; i += chunkSize) {
        articleChunks.push(docs.slice(i, i + chunkSize));
      }

      res.render("saved/index", {
        title: "Saved",
        articles: articleChunks,
        qty: totalSavedArticles
      });
    });
});
router.get("/delete", function(req, res, next) {
  Article.deleteMany({ isSaved: false }, function(err, data) {
    if (err) return handleError(err);
    res.redirect("/");
  });
});

router.get("/save-article/:id", function(req, res) {
  var articleId = req.params.id;
  Article.findById(articleId, function(err, article) {
    if (article.isSaved) {
      Article.findByIdAndUpdate(
       
        req.params.id,
        
        { isSaved: false, buttonStatus: "Save" },
       
        { new: true },
        // callback
        function(err, data) {
          res.redirect("/");
        }
      );
    } else {
      Article.findByIdAndUpdate(
        
        req.params.id,
        
        { isSaved: true, buttonStatus: "Remove" },
      
        { new: true },
        
        function(err, data) {
          res.redirect("/saved");
        }
      );
    }
  });
});

router.get("/scrape/:section", function(req, res) {
  var section = req.params.section;
  var sectionUrl = "";

  switch (section) {
    case "us":
      sectionUrl = "https://www.nytimes.com/section/us";
      break;
    case "business":
      sectionUrl = "https://www.nytimes.com/section/business";
      break;
    case "tech":
      sectionUrl = "https://www.nytimes.com/section/technology";
      break;
    case "travel":
      sectionUrl = "https://www.nytimes.com/section/travel";
      break;
    case "style":
      sectionUrl = " https://www.nytimes.com/section/style";
      break;
    default:
    
  }
  axios.get(sectionUrl).then(function(response) {
   
    var $ = cheerio.load(response.data);
    var result = {};
    $("div.css-4jyr1y").each(function(i, element) {
      var link = $(element)
        .find("a")
        .attr("href");
      var title = $(element)
        .find("h2.e1xfvim30")
        .text()
        .trim();
      var description = $(element)
        .find("p.e1xfvim31")
        .text()
        .trim();
      var imagePath = $(element)
        .parent()
        .find("figure.css-196wev6")
        .find("img")
        .attr("src");
      var baseURL = "https://www.nytimes.com";
      result.link = baseURL + link;
      result.title = title;
      if (description) {
        result.description = description;
      }
      if (imagePath) {
        result.imagePath = imagePath;
      } else {
        result.imagePath =
          "https://via.placeholder.com/205x137.png?text=No%20Image%20from%20NYTimes";
      }

      if (section !== "us") {
        result.section = section;
      } else {
        result.section = "U.S.";
      }

     
      Article.create(result)
        .then(function(dbArticle) {
         
          console.log("---------------------------");
          console.log("View the added result in the console", dbArticle);
        })
        .catch(function(err) {
         
          console.log(err);
        });
    });
    console.log("Scrape Complete");
    res.redirect("/");
  });
});


router.get("/articles/:id", function(req, res) {
 
  Article.findOne({ _id: req.params.id })
    
    .populate("comments")
    .then(function(dbArticle) {
    
      var commentsToDisplay = [];

      if (dbArticle.comments === undefined || dbArticle.comments.length == 0) {
        commentsToDisplay = [
          {
            commentBody: "Your are the first person to comment.",
            username: "N/A"
          }
        ];
      } else {
        commentsToDisplay = dbArticle.comments;
      }

      res.render("article/index", {
        articleId: dbArticle._id,
        imagePath: dbArticle.imagePath,
        title: dbArticle.title,
        description: dbArticle.description,
        section: dbArticle.section,
        link: dbArticle.link,
        comments: commentsToDisplay,
        date: dbArticle.date,
        isSaved: dbArticle.isSaved,
        buttonStatus: dbArticle.buttonStatus
      });
    })
    .catch(function(err) {
      res.json(err);
    });
});

router.post("/articles/:id", function(req, res) {
  var redirectBackToArticle = `/articles/${req.params.id}`;
  var articleId = req.params.id;
  var body = req.body;
  var res_body = {
    commentBody: body.new_comment_body,
    username: body.new_comment_username,
    articleId: articleId
  };
  Comment.create(res_body)
    .then(function(dbComment) {
      return Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comments: dbComment._id } },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.redirect(redirectBackToArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

router.get("/deletecomment/:id", function(req, res, next) {
  var articleId = "";
  Comment.findById({ _id: req.params.id }).exec(function(err, doc) {
    console.log(doc);
    articleId = doc.articleId;

    var redirectBackToArticle = `/articles/${articleId}`;
    console.log(redirectBackToArticle);

    Comment.deleteOne({ _id: req.params.id }, function(err, data) {
      if (err) return handleError(err);
      res.redirect(redirectBackToArticle);
    });
  });
});

module.exports = router;
