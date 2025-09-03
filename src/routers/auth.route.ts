import {Router} from "express";
import AuthController from "../controllers/AuthController";

const authRouter = Router();

authRouter.post("/signup",AuthController.signUp);
authRouter.post("/signin",AuthController.signIn);
authRouter.post("/forget",AuthController.recoverPassword);

export default authRouter;