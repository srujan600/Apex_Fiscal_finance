import { Router, Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';

export const reportsRouter = Router();

// GET /api/reports/variance
reportsRouter.get('/variance', (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'Q3';
    const report = reportsService.getVarianceReport(period);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/export/csv
reportsRouter.get('/export/csv', (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = (req.query.type as any) || 'variance';
    const period = (req.query.period as string) || 'Q3';

    const csvContent = reportsService.exportCsv(type, period);
    const filename = `apex_fiscal_${type}_export_${period}_2026.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});
