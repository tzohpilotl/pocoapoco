import m from "mithril";
import { API_BASE_URL } from "../config";

function isValidStatus(status) {
  return (
    status != null &&
    typeof status === "object" &&
    typeof status.id === "string" &&
    typeof status.name === "string"
  );
}

// The overall Project Status catalog, loaded once so the create-project form
// can offer a status picker. Read-only from the client's perspective — the
// catalog is seeded server-side (see backend/src/seed.ts).
const ProjectStatuses = {
  list: [],

  load() {
    return m
      .request({ method: "GET", url: `${API_BASE_URL}/project-statuses`, withCredentials: true })
      .then((response) => {
        if (!Array.isArray(response) || !response.every(isValidStatus)) {
          throw new Error("Invalid project statuses response from API");
        }
        ProjectStatuses.list = response;
      });
  },
};

export default ProjectStatuses;
