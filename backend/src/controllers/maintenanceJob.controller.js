import * as jobService from '../services/maintenanceJob.service.js';

export const createJob = async (req, res, next) => {
  try {
    const newJob = await jobService.createJob(req.body);
    res.status(201).json({
      success: true,
      data: newJob
    });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.getJobs(req.query);
    res.status(200).json({
      success: true,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req, res, next) => {
  try {
    const updatedJob = await jobService.updateJob(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    next(error);
  }
};
