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

// GET /api/reports/export/csv and GET /api/reports/export/:type
const handleExportCsv = (req: Request, res: Response, next: NextFunction) => {
  try {
    const paramType = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;
    const rawType = String(paramType || req.query.type || 'variance');
    const type = rawType.replace(/\.csv$/, '') as any;
    const period = (req.query.period as string) || 'Q3';

    const validTypes = ['variance', 'spending', 'audit', 'budgets'];
    const exportType = validTypes.includes(type) ? type : 'variance';

    const csvContent = reportsService.exportCsv(exportType, period);
    const filename = `apex_fiscal_${exportType}_export_${period}_2026.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

reportsRouter.get('/export/csv', handleExportCsv);
reportsRouter.get('/export/:type', handleExportCsv);

