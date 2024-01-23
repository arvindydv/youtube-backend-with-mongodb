import dotenv from "dotenv";
import app from "./app.js";
import connnectDB from "./db/index.js";

dotenv.config({
    path: './env'
})


connnectDB()
.then(()=>{
    app.listen(process.env.PORT || 3000, ()=>{
        console.log("application listening on port ", process.env.PORT);
    })
})
.catch((err) => {
    console.log("database connection error", err);
});