const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {
  app.route('/').get((req, res) => {
    res.render(__dirname + '/views/pug', { title: 'Hello', message: 'Please login', showLogin: true, showRegistration: true });
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  app.route('/register')
    .post((req, res, next) => {
      const hash = bcrypt.hashSync(req.body.password, 12)
      myDataBase.findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          next(res);
        } else if (user) {
          res.redirect('/');
        } else {
          myDataBase.insertOne({
            username: req.body.username,
            password: hash,
          }, 
            (err, doc) => {
              if (err) {
                res.redirect('/');
              } else {
                next(null, doc.ops[0]);
              }
            }
          );
        }
      });
    },
      passport.authenticate('local', { failureRedirect: '/'}),
      (req, res, next) => {
        res.redirect('/profile');
      }
  );

  app.route('/profile').get((req, res, next) => {
    if(req.isAuthenticated()) {
      return next();
    }
    
    res.redirect('/');
  }, (req, res) => {
    res.render(__dirname + '/views/pug/profile', { username: req.user.username });
  });

  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect();
  });

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('No existe brother');
  });
}
