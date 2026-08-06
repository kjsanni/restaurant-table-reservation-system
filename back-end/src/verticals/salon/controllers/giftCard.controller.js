"use strict";
const giftCardDao = require("../DAOs/giftCard.dao");
const { createCrudHandlers } = require("./base.controller");

const giftCardHandlers = createCrudHandlers(giftCardDao, "GiftCard", {
  displayName: "Gift card",
});

module.exports = {
  ...giftCardHandlers,
};
