const mockQueue = {
  add: jest.fn(),
  close: jest.fn(() => Promise.resolve()),
  getJob: jest.fn(),
  getJobs: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  drain: jest.fn(() => Promise.resolve()),
  clean: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve()),
  removeRepeatable: jest.fn(() => Promise.resolve()),
};

const mockWorker = {
  close: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  resume: jest.fn(),
  on: jest.fn(),
};

module.exports = {
  Queue: jest.fn(() => mockQueue),
  Worker: jest.fn(() => mockWorker),
  FlowProducer: jest.fn(),
  QueueScheduler: jest.fn(),
  QueueEvents: jest.fn(),
  QueueBase: jest.fn(),
  RedisConnection: jest.fn(),
};
