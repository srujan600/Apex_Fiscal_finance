import { Router, Request, Response, NextFunction } from 'express';
import { departmentsService } from './departments.service';
import { ApiResponse } from '../../types/common';

export const departmentsRouter = Router();

// GET /api/departments
departmentsRouter.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = departmentsService.getAllDepartments();
    const response: ApiResponse = {
      success: true,
      data: departments,
      meta: { timestamp: new Date().toISOString(), count: departments.length },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/departments/:id
departmentsRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const department = departmentsService.getDepartmentById(String(req.params.id));
    const response: ApiResponse = {
      success: true,
      data: department,
      meta: { timestamp: new Date().toISOString() },
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});
