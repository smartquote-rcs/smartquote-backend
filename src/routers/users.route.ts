import {Router} from "express";
import UserController from "../controllers/UserController";

const userRouter = Router();

userRouter.get("/",UserController.getAll);
userRouter.get("/:id",UserController.getById);
userRouter.post("/create",UserController.create);
userRouter.delete("/:id",UserController.delete);
userRouter.patch("/:id",UserController.patch);


// Nova rota: buscar usuário por email
userRouter.get("/by-email/:email", UserController.getByEmail);
export default userRouter;