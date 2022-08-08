"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const session = require("express-session");
const passport = require("passport");
const routes = require("./routes");
const auths = require("./auth");
const passportSocketIo = require("passport.socketio");
const MongoStore = require("connect-mongo");
const URI = process.env.MONGO_URI;
const store = MongoStore.create({ mongoUrl: URI });
const coockieParser = require("cookie-parser");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.set("view engine", "pug");
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: store,
    cookie: { secure: false },
    key: "express.sid",
  })
);

app.use(passport.initialize());
app.use(passport.session());

const onAuthorizeSuccess = (data, accept) => {
  console.log("successful connection to socket.io");

  accept(null, true);
};

const onAuthorizeFail = (data, message, error, accept) => {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
};

myDB(async (client) => {
  const myDataBase = await client.db("my_chat").collection("users");
  let currentUsers = 0;

  routes(app, myDataBase);
  auths(app, myDataBase);

  io.use(
    passportSocketIo.authorize({
      cookieParser: coockieParser,
      key: "express.sid",
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail,
    })
  );

  io.on("connection", (socket) => {
    ++currentUsers;
    io.emit("user count", currentUsers);
    socket.on("disconnect", () => {
      --currentUsers;
      console.log("disconected");
    });
    console.log("user " + socket.request.user.name + " connected");
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
