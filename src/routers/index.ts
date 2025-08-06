import {Router} from "express";
import authRouter from "./auth.route";
import employeeRouter from "./employee.route";

const routers = Router();

routers.use("/auth", authRouter);
routers.use("/employee", employeeRouter);
export default routers;