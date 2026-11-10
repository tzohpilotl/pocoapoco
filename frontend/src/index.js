import m from "mithril";
import Session from "./models/session";
import TrackedProjects from "./models/trackedProjects";
import ProjectStatuses from "./models/projectStatuses";

// Google's branded "G" mark — same asset tempo-app uses on its login button,
// so the sign-in affordance reads identically across the suite.
const googleIcon = () =>
  m.trust(
    '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
      '<path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>' +
      '<path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>' +
      '<path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>' +
      '<path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>' +
      "</svg>",
  );

// Full-screen signed-out view, mirroring tempo-app's LoginPage: ambient grid,
// a glow orb behind a centered card with the logo, tagline, a branded
// "Continue with Google" button, and fine print. Rendered on its own (no app
// chrome) exactly like tempo's standalone /login route. Sign-in is a plain
// link to the backend OAuth endpoint, since it's a full-page redirect.
const LoginView = {
  view() {
    return m("div", { class: "loginRoot" }, [
      m("div", { class: "loginGrid", "aria-hidden": "true" }),
      m("div", { class: "loginOrb", "aria-hidden": "true" }),
      m("main", { class: "loginCard" }, [
        m("div", { class: "loginLogo" }, [
          m("span", { class: "loginLogoMark" }, "◈"),
          m("span", { class: "loginLogoText" }, "Job Tracker"),
        ]),
        m("p", { class: "loginTagline" }, [
          "Track every application.",
          m("br"),
          "Know where each one stands.",
        ]),
        m("a", { class: "loginGoogleBtn", href: Session.loginUrl() }, [
          googleIcon(),
          "Continue with Google",
        ]),
        m("p", { class: "loginFine" }, "Sign in with your Google account. Nothing else required."),
      ]),
    ]);
  },
};

// Create-project form (name, description, status) — a closure component so
// each open/close cycle starts with fresh local field state. POSTs via
// TrackedProjects.create(), which reloads the list on success, then calls
// ondone() to collapse the form.
function NewProjectForm() {
  let name = "";
  let description = "";
  let projectStatusId = "";
  let submitting = false;
  let error = null;

  function reset() {
    name = "";
    description = "";
    projectStatusId = "";
    submitting = false;
    error = null;
  }

  const canSubmit = () => name.trim() !== "" && projectStatusId !== "" && !submitting;

  return {
    view(vnode) {
      const { ondone, oncancel } = vnode.attrs;
      return m(
        "form",
        {
          class: "newProject card",
          onsubmit(e) {
            e.preventDefault();
            if (!canSubmit()) return;
            submitting = true;
            error = null;
            TrackedProjects.create({
              name: name.trim(),
              description: description.trim() || undefined,
              projectStatusId,
            })
              .then(() => {
                reset();
                ondone();
              })
              .catch(() => {
                submitting = false;
                error = "Couldn't create the project. Please try again.";
                m.redraw();
              });
          },
        },
        [
          m("div", { class: "field" }, [
            m("label", { class: "fieldLabel", for: "np-name" }, "Name"),
            m("input", {
              id: "np-name",
              class: "input",
              type: "text",
              value: name,
              placeholder: "e.g. Acme Corp — Backend Engineer",
              oninput: (e) => {
                name = e.target.value;
              },
            }),
          ]),
          m("div", { class: "field" }, [
            m("label", { class: "fieldLabel", for: "np-desc" }, "Description"),
            m("input", {
              id: "np-desc",
              class: "input",
              type: "text",
              value: description,
              placeholder: "optional",
              oninput: (e) => {
                description = e.target.value;
              },
            }),
          ]),
          m("div", { class: "field" }, [
            m("label", { class: "fieldLabel", for: "np-status" }, "Status"),
            m(
              "select",
              {
                id: "np-status",
                class: "input",
                value: projectStatusId,
                onchange: (e) => {
                  projectStatusId = e.target.value;
                },
              },
              [
                m("option", { value: "", disabled: true }, "Select a status…"),
                ProjectStatuses.list.map((status) =>
                  m("option", { value: status.id, key: status.id }, status.name)
                ),
              ]
            ),
          ]),
          error ? m("p", { class: "formError" }, error) : null,
          m("div", { class: "formActions" }, [
            m(
              "button",
              { type: "submit", class: "btn btn-primary", disabled: !canSubmit() },
              submitting ? "Adding…" : "Track project"
            ),
            m(
              "button",
              {
                type: "button",
                class: "btn btn-secondary",
                onclick() {
                  reset();
                  oncancel();
                },
              },
              "Cancel"
            ),
          ]),
        ]
      );
    },
  };
}

const AppView = {
  creating: false,

  view() {
    return [
      m("div", { class: "topBar" }, [
        m("span", { class: "logoMark" }, "◈"),
        m("span", { class: "logoText" }, "Job Tracker"),
        m("span", { class: "spacer" }),
        m("span", { class: "account" }, [
          m("span", { class: "accountEmail" }, Session.current.email),
          m("button", { class: "linkButton", onclick: () => Session.logout() }, "Sign out"),
        ]),
      ]),
      m("main", { class: "page" }, [
        m("div", { class: "header" }, [
          m("h1", { class: "title" }, "Projects"),
          m("span", { class: "count" }, TrackedProjects.list.length),
          m("span", { class: "spacer" }),
          AppView.creating
            ? null
            : m(
                "button",
                {
                  class: "btn btn-primary",
                  onclick() {
                    AppView.creating = true;
                  },
                },
                "+ New project"
              ),
        ]),
        AppView.creating
          ? m(NewProjectForm, {
              ondone() {
                AppView.creating = false;
              },
              oncancel() {
                AppView.creating = false;
              },
            })
          : null,
        TrackedProjects.list.length === 0
          ? m("div", { class: "empty" }, "nothing tracked yet")
          : m(
              "ul",
              { class: "list" },
              TrackedProjects.list.map((project) =>
                m("li", { class: "surface-row", key: project.id }, [
                  m("div", { class: "cardMain" }, [
                    m("span", { class: "projectName" }, project.name),
                    project.description
                      ? m("span", { class: "projectDesc" }, project.description)
                      : null,
                  ]),
                  project.projectStatus
                    ? m("span", { class: "pill pill-accent" }, project.projectStatus.name)
                    : null,
                ])
              )
            ),
      ]),
    ];
  },
};

const App = {
  // Guards against a flash of the login screen before /auth/me resolves —
  // same intent as tempo-app's LoginPage returning null while `loading`.
  ready: false,

  oninit() {
    Session.load()
      .then(() => {
        if (Session.isAuthenticated) {
          return Promise.all([TrackedProjects.load(), ProjectStatuses.load()]);
        }
      })
      .finally(() => {
        App.ready = true;
        m.redraw();
      });
  },

  view() {
    if (!App.ready) {
      return null;
    }
    return Session.isAuthenticated ? m(AppView) : m(LoginView);
  },
};

m.mount(document.getElementById("app"), App);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
