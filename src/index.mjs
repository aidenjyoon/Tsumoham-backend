import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";

import User from "./db-utils/user.js";

import { Strategy as TwitchStrategy } from "twitch-passport";

dotenv.config();

const app = express();

await mongoose.connect(
  `${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}}`
);

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:4000", credentials: true }));

app.set("trust proxy", 1); // trust first proxy

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    // secret: "secretcode",
    resave: true,
    saveUninitialized: true,
    cookie: {
      sameSite: "none", // since we are using new page for signing in
      secure: true, // require httpes
      maxAge: 1000 * 60 * 60 * 24 * 7, // one week in ms
    },
  })
);

// Passport middleware initialization
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  return done(null, user._id);
});

// taking entire user object from the session and attaching it to the req.user object
// (Bad. we should only store user ID in better apps)
passport.deserializeUser(async (id, done) => {
  try {
    const doc = await User.findById(id);
    return done(null, doc);
  } catch (err) {
    console.error(err, "Unable to find the user");
  }
});

passport.use(
  new TwitchStrategy(
    {
      clientID: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
      callbackURL: "/auth/twitch/callback",
      scope: [
        "user:read:email",
        "user:read:follows",
        "user:read:subscriptions",
        "channel:read:stream_key",
        "moderator:read:followers",
        "moderator:read:chatters",
      ],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const doc = await User.findOne({ twitchId: profile.id });

        // if couldn't find the user
        if (!doc) {
          console.log("THIS IS profile", profile);
          console.log("============================================");
          const newUser = new User({
            twitchId: profile.id,
            username: profile.userName,
          });

          await newUser.save();
          done(null, newUser);
        }
        done(null, doc);
      } catch (err) {
        console.error("failed to access twitch", err);
        done(err);
      }
    }
  )
);

app.get("/auth/twitch", passport.authenticate("twitch"));

app.get(
  "/auth/twitch/callback",
  passport.authenticate("twitch", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("localhost:3000");
  }
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/getuser", (req, res) => {
  res.send(req.user);
});

app.get("/auth/logout", (req, res) => {
  if (req.user) {
    // logout using passport
    req.logout((err) => {
      if (err) {
        console.error(err, "logout failed");
      }
    });
    res.send("logout successful!");
  }
});

const host = "0.0.0.0";
// const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const port = 4000;

app.listen(port, host, () => {
  console.log("server started");
});
