import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

// set origin 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
}))

// set json data limit
app.use(express.json({limit: "20kb"}));
app.use(express.urlencoded({extended: true, limit: "20kb"}));
// public assets
app.use(express.static("public"));
app.use(cookieParser());

// import routes
import userRouter from "./routes/user.routes.js"

// route declarations
app.use("/api/v1/users", userRouter)

export default app;