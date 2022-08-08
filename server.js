"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const session = require("express-session");
const passport = require("passport");
const routes = require("./routes");
const auths = require("./auth");

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
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = await client.db("my_chat").collection("users");
  let currentUsers = 0;

  routes(app, myDataBase);
  auths(app, myDataBase);

  io.on("connection", (socket) => {
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log("A user has connected");
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
