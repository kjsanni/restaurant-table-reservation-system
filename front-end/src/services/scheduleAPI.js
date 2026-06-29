import API from "./API";

const getSchedules = () => {
  return API.get("/schedule/schedules");
};

const updateSchedule = (id, scheduleData) => {
  return API.patch("/schedule/schedules/" + id, scheduleData);
};

const getHolidays = () => {
  return API.get("/schedule/holidays");
};

const createHoliday = (holidayData) => {
  return API.post("/schedule/holidays", holidayData);
};

const deleteHoliday = (id) => {
  return API.delete("/schedule/holidays/" + id);
};

const exportScheduleCSV = () => {
  return API.get("/schedule/export/csv", { responseType: "blob" });
};

const exportSchedulePDF = () => {
  return API.get("/schedule/export/pdf", { responseType: "blob" });
};

export default {
  getSchedules,
  updateSchedule,
  getHolidays,
  createHoliday,
  deleteHoliday,
  exportScheduleCSV,
  exportSchedulePDF,
};
