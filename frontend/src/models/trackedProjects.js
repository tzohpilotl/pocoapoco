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
};

export default TrackedProjects;
