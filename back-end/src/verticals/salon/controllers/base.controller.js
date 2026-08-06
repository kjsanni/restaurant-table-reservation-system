"use strict";

const createCrudHandlers = (dao, entityName, options = {}) => {
  const displayName = options.displayName || entityName;
  const passQueryToFindAll = options.passQueryToFindAll !== false;

  const getTenantId = (req) => req.tenant?.id;
  const logError = (operation, err) => console.error(`${operation} error:`, err.message);

  const createHandler = async (req, res) => {
    try {
      const record = await dao.create(req.body, getTenantId(req));
      return res.status(201).json({ success: true, data: record });
    } catch (err) {
      logError(`create${entityName}Handler`, err);
      return res.status(500).json({ success: false, message: `Failed to create ${displayName}` });
    }
  };

  const listHandler = async (req, res) => {
    try {
      const records = passQueryToFindAll ? await dao.findAll(getTenantId(req), req.query) : await dao.findAll(getTenantId(req));
      return res.status(200).json({ success: true, data: records });
    } catch (err) {
      logError(`get${entityName}sHandler`, err);
      return res.status(500).json({ success: false, message: `Failed to load ${displayName}s` });
    }
  };

  const getHandler = async (req, res) => {
    try {
      const record = await dao.findById(req.params.id, getTenantId(req));
      if (!record) {
        return res.status(404).json({ success: false, message: `${displayName} not found` });
      }
      return res.status(200).json({ success: true, data: record });
    } catch (err) {
      logError(`get${entityName}Handler`, err);
      return res.status(500).json({ success: false, message: `Failed to load ${displayName}` });
    }
  };

  const updateHandler = async (req, res) => {
    try {
      const updated = await dao.update(req.params.id, getTenantId(req), req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: `${displayName} not found` });
      }
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      logError(`update${entityName}Handler`, err);
      return res.status(500).json({ success: false, message: `Failed to update ${displayName}` });
    }
  };

  const deleteHandler = async (req, res) => {
    try {
      const removed = await dao.delete(req.params.id, getTenantId(req));
      if (!removed) {
        return res.status(404).json({ success: false, message: `${displayName} not found` });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      logError(`delete${entityName}Handler`, err);
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
