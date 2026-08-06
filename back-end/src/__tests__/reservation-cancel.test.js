const reservationService = require("../services/reservationService");

jest.mock("../DAOs/reservation.dao");

const reservationDAO = require("../DAOs/reservation.dao");

describe("reservationService.cancelReservation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("soft-deletes a terminal-state reservation (seated) instead of hard-deleting", async () => {
    reservationDAO.findReservationById.mockResolvedValue({ id: 1, resStatus: "seated", tenantId: 1 });
    reservationDAO.deleteReservation.mockResolvedValue({ id: 1, resStatus: "cancelled" });

    const result = await reservationService.cancelReservation(1, reservationDAO, 1);

    expect(reservationDAO.deleteReservation).toHaveBeenCalledWith({ id: 1, resStatus: "seated", tenantId: 1 }, 1);
    expect(reservationDAO.destroyReservation).not.toHaveBeenCalled();
    expect(result.resStatus).toBe("cancelled");
  });

  it("soft-deletes a terminal-state reservation (completed) instead of hard-deleting", async () => {
    reservationDAO.findReservationById.mockResolvedValue({ id: 2, resStatus: "completed", tenantId: 1 });
    reservationDAO.deleteReservation.mockResolvedValue({ id: 2, resStatus: "cancelled" });

    const result = await reservationService.cancelReservation(2, reservationDAO, 1);

    expect(reservationDAO.deleteReservation).toHaveBeenCalledWith({ id: 2, resStatus: "completed", tenantId: 1 }, 1);
    expect(reservationDAO.destroyReservation).not.toHaveBeenCalled();
    expect(result.resStatus).toBe("cancelled");
  });

  it("soft-deletes a terminal-state reservation (missed) instead of hard-deleting", async () => {
    reservationDAO.findReservationById.mockResolvedValue({ id: 3, resStatus: "missed", tenantId: 1 });
    reservationDAO.deleteReservation.mockResolvedValue({ id: 3, resStatus: "cancelled" });

    const result = await reservationService.cancelReservation(3, reservationDAO, 1);

    expect(reservationDAO.deleteReservation).toHaveBeenCalledWith({ id: 3, resStatus: "missed", tenantId: 1 }, 1);
    expect(reservationDAO.destroyReservation).not.toHaveBeenCalled();
    expect(result.resStatus).toBe("cancelled");
  });

  it("soft-deletes a terminal-state reservation (cancelled) instead of hard-deleting", async () => {
    reservationDAO.findReservationById.mockResolvedValue({ id: 4, resStatus: "cancelled", tenantId: 1 });
    reservationDAO.deleteReservation.mockResolvedValue({ id: 4, resStatus: "cancelled" });

    const result = await reservationService.cancelReservation(4, reservationDAO, 1);

    expect(reservationDAO.deleteReservation).toHaveBeenCalledWith({ id: 4, resStatus: "cancelled", tenantId: 1 }, 1);
    expect(reservationDAO.destroyReservation).not.toHaveBeenCalled();
    expect(result.resStatus).toBe("cancelled");
  });

  it("soft-deletes a non-terminal reservation", async () => {
    reservationDAO.findReservationById.mockResolvedValue({ id: 5, resStatus: "confirmed", tenantId: 1 });
    reservationDAO.deleteReservation.mockResolvedValue({ id: 5, resStatus: "cancelled" });

    const result = await reservationService.cancelReservation(5, reservationDAO, 1);

    expect(reservationDAO.deleteReservation).toHaveBeenCalledWith({ id: 5, resStatus: "confirmed", tenantId: 1 }, 1);
    expect(reservationDAO.destroyReservation).not.toHaveBeenCalled();
    expect(result.resStatus).toBe("cancelled");
  });

  it("returns 404 when reservation does not exist", async () => {
    reservationDAO.findReservationById.mockResolvedValue(null);

    await expect(reservationService.cancelReservation(999, reservationDAO, 1)).rejects.toEqual({
      status: 404,
      message: "Reservation not found!",
    });

    expect(reservationDAO.deleteReservation).not.toHaveBeenCalled();
    expect(reservationDAO.destroyReservation).not.toHaveBeenCalled();
  });
});
