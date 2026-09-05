import * as priorityService from '../services/priority.service.js';

export const getPriorities = async (req, res, next) => {
  try {
    const data = await priorityService.getRankedMaintenanceJobs(req.query);
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};
