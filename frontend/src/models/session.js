import m from "mithril";
import { API_BASE_URL } from "../config";

function isValidUser(user) {
  return (
    user != null &&
    typeof user === "object" &&
    typeof user.id === "string" &&
    typeof user.email === "string"
  );
}

const Session = {
  // null when signed out (or not yet loaded); { id, email } when signed in.
  current: null,

  get isAuthenticated() {
    return Session.current != null;
  },

  // Asks the API who the signed-in user is. The session cookie is HttpOnly, so
  // this round-trip (with credentials, so the cookie is sent cross-origin) is
  // the only way the SPA can learn its auth state. A 401 is the expected
  // signed-out case, not an error.
  load() {
    return m
      .request({ method: "GET", url: `${API_BASE_URL}/auth/me`, withCredentials: true })
      .then((user) => {
        if (!isValidUser(user)) {
          throw new Error("Invalid user response from API");
        }
        Session.current = user;
        return user;
      })
      .catch((error) => {
        if (error && error.code === 401) {
          Session.current = null;
          return null;
        }
        throw error;
      });
  },

  // A plain link the UI points the browser at to start the OAuth flow — not an
  // XHR, since Google's consent screen is a full-page redirect.
  loginUrl() {
    return `${API_BASE_URL}/auth/google`;
  },

  logout() {
    window.location.assign(`${API_BASE_URL}/auth/logout`);
  },
};

export default Session;
