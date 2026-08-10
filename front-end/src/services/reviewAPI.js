import API from "./API";

class ReviewAPI {
  createReview(data) {
    return API.post("/reviews", data);
  }

  getReviews(params = {}) {
    return API.get("/reviews", { params });
  }

  getReview(id) {
    return API.get(`/reviews/${id}`);
  }

  respondToReview(id, response) {
    return API.patch(`/reviews/${id}`, { response });
  }

  deleteReview(id) {
    return API.delete(`/reviews/${id}`);
  }

  getAverageRating(params = {}) {
    return API.get("/reviews/average", { params });
  }

  flagReview(id, reason) {
    return API.post(`/reviews/${id}`, { reason });
  }

  unflagReview(id) {
    return API.post(`/reviews/${id}/unflag`);
  }
}

export default new ReviewAPI();
