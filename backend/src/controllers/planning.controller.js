import { generateDailyPlan } from '../services/planning.service.js';

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
