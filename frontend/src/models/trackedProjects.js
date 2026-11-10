import m from "mithril";
import { API_BASE_URL } from "../config";

function isValidProject(project) {
  return (
    project != null &&
    typeof project === "object" &&
    (typeof project.id === "string" || typeof project.id === "number") &&
    typeof project.name === "string"
  );
}

const TrackedProjects = {
  list: [],

  load() {
    return m
      .request({ method: "GET", url: `${API_BASE_URL}/projects`, withCredentials: true })
      .then((response) => {
        if (!Array.isArray(response) || !response.every(isValidProject)) {
          throw new Error("Invalid projects response from API");
        }
        TrackedProjects.list = response;
      });
  },

  // Create a project, then reload the list so the new row (with its joined
  // status) is reflected — the POST response isn't trusted as the source of
  // truth for the list; load() re-validates the full set.
  create({ name, description, projectStatusId }) {
    return m
      .request({
        method: "POST",
        url: `${API_BASE_URL}/projects`,
        withCredentials: true,
        body: { name, description, projectStatusId },
      })
      .then(() => TrackedProjects.load());
  },
};

export default TrackedProjects;
