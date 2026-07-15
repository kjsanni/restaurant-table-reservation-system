/**
 * Lightweight client-side validation for the reservation form.
 * Mirrors backend business rules to give immediate UX feedback before submit.
 */
export function validateReservation(r = {}) {
  const errors = [];
  const str = (v) => String(v == null ? "" : v);

  if (!str(r.firstName).trim()) errors.push("First name is required.");
  if (!str(r.lastName).trim()) errors.push("Last name is required.");

  const phone = str(r.phone).replace(/\D/g, "");
  if (!phone) errors.push("Phone number is required.");
  else if (phone.length < 10 || phone.length > 15)
    errors.push("Phone number must be 10-15 digits.");

  if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(r.email)))
    errors.push("Enter a valid email address.");

  if (!r.resDate) errors.push("Reservation date is required.");
  else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(r.resDate) < today)
      errors.push("Reservation date cannot be in the past.");
  }

  if (!r.resTime) errors.push("Reservation time is required.");

  const people = Number(r.people);
  if (!people || people < 1)
    errors.push("Number of people must be at least 1.");
  else if (people > 20) errors.push("Number of people cannot exceed 20.");

  if (r.expectedTotal !== "" && r.expectedTotal != null) {
    const expected = Number(r.expectedTotal);
    if (isNaN(expected) || expected < 0)
      errors.push("Expected total must be a positive amount.");
  }

  if (str(r.notes).length > 500)
    errors.push("Notes cannot exceed 500 characters.");

  return errors;
}
