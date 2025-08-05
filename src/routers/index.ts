import {Router} from "express";
import authRouter from "./auth.route";

const routers = Router();

routers.use("/auth", authRouter);

export default routers;