import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import passport from "passport";

dotenv.config();

const app = express();

mongoose.connect(
  `${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}}`
);

// Middleware
app.use(express.json());
app.use(cors({ origin: "localhost:4000", credentials: true }));

app.set("trust proxy", 1); // trust first proxy

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
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

app.get("/", (req, res) => {
  res.send("Hello World");
});

const host = "0.0.0.0";
// const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const port = 4000;

app.listen(port, host, () => {
  console.log("server started");
});
