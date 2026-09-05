import {
  findAllStations,
  findAllSectionsWithStations,
  findAllAssetsWithSection
} from '../repositories/network.repository.js';

export const handleGetStations = async (req, res, next) => {
  try {
    const stations = await findAllStations();
    res.status(200).json({
      success: true,
      data: stations
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetSections = async (req, res, next) => {
  try {
    const sections = await findAllSectionsWithStations();
    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (err) {
    next(err);
  }
};

export const handleGetAssets = async (req, res, next) => {
  try {
    const assets = await findAllAssetsWithSection();
    res.status(200).json({
      success: true,
      data: assets
    });
  } catch (err) {
    next(err);
  }
};
