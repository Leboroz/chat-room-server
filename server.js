"use strict";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import myDB from "./connection.js";
import session from "express-session";
import passport from "passport";
import routes from "./routes.js";
import auths from "./auth.js";
import passportSocketIo from "passport.socketio";
import MongoStore from "connect-mongo";
import { createServer } from "http";
import coockieParser from "cookie-parser";
import { Server } from "socket.io";

const URI = process.env.MONGO_URI;
const store = MongoStore.create({ mongoUrl: URI });

const app = express();
const http = createServer(app);
const io = new Server(http);

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

    io.emit("user", {
      name: socket.request.user.name || socket.request.user.username,
      currentUsers,
      connected: true,
    });

    socket.on("chat message", (message) => {
      io.emit("chat message", {
        name: socket.request.user.name || socket.request.user.username,
        message,
      });
    });

    socket.on("disconnect", () => {
      --currentUsers;
    });

    console.log(
      "user " + socket.request.user.name ||
        socket.request.user.username + " connected"
    );
  });
}).catch((e) => {
  app.route("/").get((req, res) => {
    res.render("pug", { title: e, message: "Unable to login" });
  });
});

const PORT = process.env.PORT || 5000;

http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
