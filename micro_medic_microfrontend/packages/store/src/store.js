const createStore = () => {
  let authToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtaWtpMTIzMTIzIiwiaWF0IjoxNzI2MDE1NTMyLCJleHAiOjYxNzkxMTE2NDAwfQ.LmF-_SkLPAhTBHEmr9NTw85Q9TzaYaqJUYB9YmaiNsk";
  const subscribers = [];

  return {
    get authToken() {
      return authToken;
    },
    set authToken(token) {
      authToken = token;
      subscribers.forEach(fn => fn());
    },
    subscribe(fn) {
      subscribers.push(fn);
    }
  }
};

const store = createStore();

export default store;
