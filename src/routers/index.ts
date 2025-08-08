import {Router} from "express";
import authRouter from "./auth.route";
import employeeRouter from "./employee.route";
import { authMiddleware } from "../middleware/authMiddleware";

const routers = Router();

routers.get("/",(req, res)=>{
    res.status(200).json("APi SmartQuote ON...");
});
routers.use("/auth", authRouter);
routers.use("/employees",authMiddleware, employeeRouter);
export default routers;