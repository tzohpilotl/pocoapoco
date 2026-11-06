import m from "mithril";
import TrackedProjects from "./models/trackedProjects";

const App = {
  oninit() {
    TrackedProjects.load();
  },
  view() {
    return [
      m("div", { class: "topBar" }, [
        m("span", { class: "logoMark" }, "◈"),
        m("span", { class: "logoText" }, "Job Tracker"),
      ]),
      m("main", { class: "page" }, [
        m("div", { class: "header" }, [
          m("h1", { class: "title" }, "Projects"),
          m("span", { class: "count" }, TrackedProjects.list.length),
        ]),
        TrackedProjects.list.length === 0
          ? m("div", { class: "empty" }, "nothing tracked yet")
          : m(
              "ul",
              { class: "list" },
              TrackedProjects.list.map((project) =>
                m("li", { class: "surface-row", key: project.id }, [
                  m("div", { class: "cardMain" }, [
                    m("span", { class: "projectName" }, project.name),
                  ]),
                  m("span", { class: "pill pill-accent" }, project.description),
                ])
              )
            ),
      ]),
    ];
  },
};

m.mount(document.getElementById("app"), App);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
