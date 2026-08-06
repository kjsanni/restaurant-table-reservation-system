function createRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

function makeRes() {
  const json = jest.fn();
  const status = jest.fn(function () {
    return { json: json };
  });
  return {
    res: { status: status, json: json },
    expectJson: function (expected) {
      expect(json).toHaveBeenCalledWith(expected);
    },
  };
}

module.exports = { createRes, makeRes };
