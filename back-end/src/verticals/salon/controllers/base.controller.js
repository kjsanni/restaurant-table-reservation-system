"use strict";

const createCrudHandlers = (dao, entityName, options = {}) => {
  const displayName = options.displayName || entityName;
  const passQueryToFindAll = options.passQueryToFindAll !== false;

  const createHandler = async (req, res) => {
    try {
      const tenantId = req.tenant?.id;
      const data = req.body;
      const record = await dao.create(data, tenantId);
      return res.status(201).json({ success: true, data: record });
    } catch (err) {
      console.error(`create${entityName}Handler error:`, err.message);
      return res.status(500).json({ success: false, message: `Failed to create ${displayName}` });
    }
  };

  const listHandler = async (req, res) => {
    try {
      const tenantId = req.tenant?.id;
      const records = passQueryToFindAll ? await dao.findAll(tenantId, req.query) : await dao.findAll(tenantId);
      return res.status(200).json({ success: true, data: records });
    } catch (err) {
      console.error(`get${entityName}sHandler error:`, err.message);
      return res.status(500).json({ success: false, message: `Failed to load ${displayName}s` });
    }
  };

  const getHandler = async (req, res) => {
    try {
      const tenantId = req.tenant?.id;
      const { id } = req.params;
      const record = await dao.findById(id, tenantId);
      if (!record) {
        return res.status(404).json({ success: false, message: `${displayName} not found` });
      }
      return res.status(200).json({ success: true, data: record });
    } catch (err) {
      console.error(`get${entityName}Handler error:`, err.message);
      return res.status(500).json({ success: false, message: `Failed to load ${displayName}` });
    }
  };

  const updateHandler = async (req, res) => {
    try {
      const tenantId = req.tenant?.id;
      const { id } = req.params;
      const updated = await dao.update(id, tenantId, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: `${displayName} not found` });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      console.error(`update${entityName}Handler error:`, err.message);
      return res.status(500).json({ success: false, message: `Failed to update ${displayName}` });
    }
  };

  const deleteHandler = async (req, res) => {
    try {
      const tenantId = req.tenant?.id;
      const { id } = req.params;
      const removed = await dao.delete(id, tenantId);
      if (!removed) {
        return res.status(404).json({ success: false, message: `${displayName} not found` });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(`delete${entityName}Handler error:`, err.message);
      return res.status(500).json({ success: false, message: `Failed to delete ${displayName}` });
    }
  };

  return {
    [`create${entityName}Handler`]: createHandler,
    [`get${entityName}sHandler`]: listHandler,
    [`get${entityName}Handler`]: getHandler,
    [`update${entityName}Handler`]: updateHandler,
    [`delete${entityName}Handler`]: deleteHandler,
  };
};

module.exports = { createCrudHandlers };
