import { generateDailyPlan, executeReplan } from '../services/planning.service.js';
import {
  findPlanningRuns,
  findPlanningRunDetails
} from '../repositories/replanning.repository.js';
import { comparePlanningRuns } from '../services/planningComparison.service.js';

export const handleGeneratePlan = async (req, res, next) => {
  try {
    const { plan_date, start_time, end_time } = req.body;

    if (!plan_date) {
      return res.status(400).json({
        success: false,
        error: 'plan_date is required (format: YYYY-MM-DD)'
      });
    }

    const plan = await generateDailyPlan({
      planDate: plan_date,
      startTime: start_time || '06:00',
      endTime: end_time || '22:00'
    });

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

export const handleReplan = async (req, res, next) => {
  try {
    const { plan_date, event } = req.body;

    if (!plan_date) {
      return res.status(400).json({
        success: false,
        error: 'plan_date is required (format: YYYY-MM-DD)'
      });
    }

    if (!event || !event.event_type) {
      return res.status(400).json({
        success: false,
        error: 'event object with event_type is required'
      });
    }

    const replanResult = await executeReplan({
      planDate: plan_date,
      event
    });

    return res.status(200).json({
      success: true,
      data: replanResult
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetRuns = async (req, res, next) => {
  try {
    const { plan_date, status } = req.query;
    const runs = await findPlanningRuns({ plan_date, status });
    return res.status(200).json({
      success: true,
      data: { runs }
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetRunById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const run = await findPlanningRunDetails(id);
    if (!run) {
      return res.status(404).json({
        success: false,
        error: `Planning run ${id} not found`
      });
    }
    return res.status(200).json({
      success: true,
      data: { run }
    });
  } catch (err) {
    next(err);
  }
};

export const handleCompareRuns = async (req, res, next) => {
  try {
    const { id, otherRunId } = req.params;
    const [run1, run2] = await Promise.all([
      findPlanningRunDetails(id),
      findPlanningRunDetails(otherRunId)
    ]);

    if (!run1 || !run2) {
      return res.status(404).json({
        success: false,
        error: 'One or both planning runs not found for comparison'
      });
    }

    const comparison = comparePlanningRuns(run1, run2);
    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (err) {
    next(err);
  }
};
