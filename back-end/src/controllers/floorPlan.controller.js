const floorPlanService = require("../services/floorPlanService");

const getHandler = async (req, res) => {
  const plans = await floorPlanService.getFloorPlans();
  return res.status(200).json({ success: true, floorPlans: plans });
};

const createHandler = async (req, res) => {
  const { name } = req.body;
  if (!name) throw { status: 400, message: "Floor plan name is required!" };
  const plan = await floorPlanService.createFloorPlan({ name });
  return res.status(201).json({ success: true, floorPlan: plan });
};

const deleteHandler = async (req, res) => {
  const { id } = req.params;
  const result = await floorPlanService.deleteFloorPlan(id);
  return res.status(200).json({ success: true, item: result });
};

module.exports = {
  getHandler,
  createHandler,
  deleteHandler,
};
