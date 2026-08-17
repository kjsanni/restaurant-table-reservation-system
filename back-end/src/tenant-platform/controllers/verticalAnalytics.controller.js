const db = require("../../db/models");

const getVerticalAnalyticsHandler = async (req, res) => {
  const verticals = ["restaurant", "salon", "event"];
  const comparison = await Promise.all(
    verticals.map(async (vertical) => {
      const tenants = await db.tenant.findAll({
        where: { businessVertical: vertical, status: { [db.Sequelize.Op.ne]: "cancelled" } },
        attributes: ["id", "name", "plan", "monthlyRevenue", "createdAt"],
      });

      const totalTenants = tenants.length;
      const totalRevenue = tenants.reduce((sum, t) => sum + parseFloat(t.monthlyRevenue || 0), 0);
      const avgRevenue = totalTenants > 0 ? totalRevenue / totalTenants : 0;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newTenants = await db.tenant.count({
        where: { businessVertical: vertical, createdAt: { [db.Sequelize.Op.gte]: thirtyDaysAgo } },
      });

      const reservations = await db.reservation.count({
        where: { tenantId: { [db.Sequelize.Op.in]: tenants.map((t) => t.id) } },
      });

      const customers = await db.customer.count({
        where: { tenantId: { [db.Sequelize.Op.in]: tenants.map((t) => t.id) } },
      });

      return {
        vertical,
        totalTenants,
        totalRevenue,
        avgRevenue,
        newTenantsLast30Days: newTenants,
        totalReservations: reservations,
        totalCustomers: customers,
      };
    })
  );

  const summary = {
    totalTenants: comparison.reduce((sum, v) => sum + v.totalTenants, 0),
    totalRevenue: comparison.reduce((sum, v) => sum + v.totalRevenue, 0),
    totalReservations: comparison.reduce((sum, v) => sum + v.totalReservations, 0),
    totalCustomers: comparison.reduce((sum, v) => sum + v.totalCustomers, 0),
  };

  res.status(200).json({ success: true, summary, comparison });
};

module.exports = {
  getVerticalAnalyticsHandler,
};
