import { Request, Response } from 'express';
import { employeeSchema } from '../schemas/Employee.schema';
import EmployeeService from '../services/EmployeeService';

class EmployeeController {

  async create(req: Request, res: Response): Promise<Response> {
    const parsed = employeeSchema.safeParse(req.body);

    if (!parsed.success) {
      const errors = parsed.error.format();
      return res.status(400).json({ errors });
    }

    try {
      const employee = await EmployeeService.create(parsed.data);
      return res.status(201).json({
        message: 'Funcionário cadastrado com sucesso.',
        user: employee,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async getAll(req: Request, res: Response): Promise<Response> {
    try {
      const employees = await EmployeeService.getAll();
      return res.status(200).json({
        message: 'Lista de funcionários.',
        data: employees,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const {id} = req.params;
      const employee = await EmployeeService.getById(String(id));
      return res.status(200).json({
        message: 'funcionário.',
        data: employee,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await EmployeeService.delete(String(id));
      return res.status(200).json({ message: 'Funcionário deletado com sucesso.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async patch(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedEmployee = await EmployeeService.updatePartial(String(id), updates);

      return res.status(200).json({
        message: 'Funcionário atualizado com sucesso.',
        data: updatedEmployee,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new EmployeeController();
