import  dotenv from "dotenv";
dotenv.config();
import express from "express";
import routers from "./routers";
import cors from "cors"
const port = process.env.PORT_DEFAULT || 2001
const app = express();

app.use(express.json());
app.use("/api",routers);

app.listen(port, ()=>console.log(`Server running in port=${port}`));