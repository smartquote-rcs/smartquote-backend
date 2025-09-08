import {Router} from "express";
import AuthController from "../controllers/AuthController";

const authRouter = Router();

authRouter.post("/signup",AuthController.signUp);
authRouter.post("/signin",AuthController.signIn);
authRouter.post("/forget",AuthController.recoverPassword);
authRouter.post("/reset-password",AuthController.resetPassword);
authRouter.post("/two-factor/init", AuthController.initiateTwoFactorAuth);
authRouter.post("/two-factor/verify", AuthController.twoFactorAuth);
authRouter.post("/two-factor/complete", AuthController.completeTwoFactorAuth);

export default authRouter;