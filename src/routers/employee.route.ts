import {Router} from "express";
import EmployeeController from "../controllers/employee.controller";

const employeeRouter = Router();

employeeRouter.get("/",EmployeeController.getAll);
employeeRouter.get("/:id",EmployeeController.getById);
employeeRouter.post("/create",EmployeeController.create);

export default employeeRouter;