import {Router} from "express";
import AuthController from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/signup",AuthController.signUp);
authRouter.post("/sigin",AuthController.signUp);

export default authRouter;