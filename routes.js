const passport = require("passport");
const bcrypt = require("bcrypt");

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/");
};

module.exports = function (app, myDataBase) {
  app.route("/").get((req, res) => {
    res.render(__dirname + "/views/pug", {
      title: "Hello",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true,
    });
  });

  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        req.session.user_id = req.user.id;
        res.redirect("/chat");
      }
    );

  app.route("/register").post(
    (req, res, next) => {
      const hash = bcrypt.hashSync(req.body.password, 12);
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(res);
        } else if (user) {
          res.redirect("/");
        } else {
          myDataBase.insertOne(
            {
              username: req.body.username,
              password: hash,
            },
            (err, doc) => {
              if (err) {
                res.redirect("/");
              } else {
                next(null, doc.ops[0]);
              }
            }
          );
        }
      });
    },

    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      res.redirect("/chat");
    }
  );

  app.route("/chat").get(ensureAuthenticated, (req, res) => {
    res.render(__dirname + "/views/pug/chat.pug", { user: req.user });
  });

  app.route("/auth/github").get(passport.authenticate("github"));
  app
    .route("/auth/github/callback")
    .get(
      passport.authenticate("github", { failureRedirect: "/" }),
      (req, res) => {
        req.session.user_id = req.user.id;
        res.redirect("/chat");
      }
    );

  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render(__dirname + "/views/pug/profile", {
      username: req.user.username,
    });
  });

  app.route("/logout").get((req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
};
