import express, { urlencoded } from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import passport from 'passport';
import cookieParser from 'cookie-parser'
import cors from 'cors';

dotenv.config(); //changed

import { connectPassport } from './utils/Provider';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();

// Middlewares
app.use(
  session({
    secret: process.env.SESSION_SECRET || '',
    resave: false,
    saveUninitialized: false,

    cookie: {
      secure: process.env.NODE_ENV === "development" ? false : true,
      httpOnly: process.env.NODE_ENV === "development" ? false : true,
      sameSite: process.env.NODE_ENV === "development" ? false : "none"
    }
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(
  urlencoded({
    extended: true,
  })
)

app.use(cors(
  {
    credentials: true,
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
))

app.use(passport.authenticate("session"))
app.use(passport.initialize());
app.use(passport.session());
app.enable("trust proxy");

connectPassport();

// Importing Routes
import userRoute_google from "./routes/user_google";
import product from "./routes/product";
import order from "./routes/order";

app.use("/api/v1", userRoute_google);
app.use("/api/v1", product);
app.use("/api/v1", order);

app.use(errorMiddleware);

export default app;
