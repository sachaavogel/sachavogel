const config = window.HOMEWORK_CONFIG || {};
const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
const supabase = hasSupabase
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;
const app = document.querySelector("#app");

const COLOR_SET = ["#f5b342", "#7d9cff", "#f38c8c", "#58c7a3", "#b58ad7", "#75bce5"];
const DEMO_KEY = "due-today-demo-v1";
const dateInputValue = (date) => new Date(date).toISOString().slice(0, 10);
const today = () => dateInputValue(new Date());
const localDate = (value) => new Date(`${value}T12:00:00`);
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;

const defaultData = () => ({
  profile: {
    id: "local-preview",
    name: "Student",
    email: "",
    reminderTime: "17:00",
    reminderMode: "daily",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    onboardingDone: false,
  },
  classes: [],
  assignments: [],
});

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
}

function loadDemo() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) || defaultData();
  } catch {
    return defaultData();
  }
}

let state = {
  user: null,
  data: defaultData(),
  page: "home",
  authOpen: false,
  authMode: "signin",
  onboardingOpen: false,
  assignmentFilter: "open",
  toast: null,
  loading: false,
};

function persistDemo() {
  localStorage.setItem(DEMO_KEY, JSON.stringify(state.data));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character]));
}

function relativeDue(date) {
  const diff = Math.round((localDate(date) - localDate(today())) / 86400000);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff === -1) return "Due yesterday";
  if (diff < -1) return `${Math.abs(diff)} days overdue`;
  return `Due in ${diff} days`;
}

function spokenDate(date, includeTomorrow = true) {
  const formatted = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(localDate(date));
  const relative = relativeDue(date).toLowerCase();
  if (includeTomorrow && relative === "due tomorrow") return `${formatted} (tomorrow)`;
  if (relative === "due today") return `${formatted} (today)`;
  return formatted;
}

function classInfo(assignment) {
  return state.data.classes.find((course) => course.id === assignment.classId)
    || { name: assignment.className, color: "#b58ad7" };
}

function showToast(message) {
  state.toast = message;
  render();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    state.toast = null;
    render();
  }, 3500);
}

async function hydrateRemoteData(user) {
  const [{ data: profile }, { data: classes }, { data: assignments }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("classes").select("*").order("created_at"),
    supabase.from("assignments").select("*").order("due_date"),
  ]);
  const current = profile || {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
    email: user.email || "",
    reminder_time: "17:00",
    reminder_mode: "daily",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    onboarding_done: false,
  };
  if (!profile) await supabase.from("profiles").upsert(current);
  state.data = {
    profile: {
      id: current.id, name: current.name, email: current.email,
      reminderTime: current.reminder_time, reminderMode: current.reminder_mode,
      timezone: current.timezone, onboardingDone: current.onboarding_done,
    },
    classes: (classes || []).map((course) => ({ id: course.id, name: course.name, color: course.color })),
    assignments: (assignments || []).map((item) => ({
      id: item.id, classId: item.class_id, className: item.class_name, description: item.description,
      dueDate: item.due_date, completed: Boolean(item.completed_at), createdAt: item.created_at,
    })),
  };
}

async function initialise() {
  if (hasSupabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await enterApp(session.user);
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && state.user?.id !== session.user.id) await enterApp(session.user);
      if (!session) { state.user = null; render(); }
    });
  } else render();
}

async function enterApp(user) {
  state.loading = true;
  render();
  state.user = user;
  if (hasSupabase) await hydrateRemoteData(user);
  state.loading = false;
  state.authOpen = false;
  state.onboardingOpen = !state.data.profile.onboardingDone;
  render();
}

async function saveProfile(changes) {
  state.data.profile = { ...state.data.profile, ...changes };
  if (hasSupabase) {
    await supabase.from("profiles").upsert({
      id: state.data.profile.id,
      name: state.data.profile.name,
      email: state.data.profile.email,
      reminder_time: state.data.profile.reminderTime,
      reminder_mode: state.data.profile.reminderMode,
      timezone: state.data.profile.timezone,
      onboarding_done: state.data.profile.onboardingDone,
    });
  } else persistDemo();
}

async function addClass(name) {
  const cleanName = name.trim();
  if (!cleanName) return;
  if (state.data.classes.some((course) => course.name.toLowerCase() === cleanName.toLowerCase())) {
    showToast("That class is already in your list.");
    return;
  }
  const course = { id: uid(), name: cleanName, color: COLOR_SET[state.data.classes.length % COLOR_SET.length] };
  state.data.classes.push(course);
  if (hasSupabase) {
    const { data, error } = await supabase.from("classes").insert({ name: course.name, color: course.color }).select().single();
    if (error) return showToast(error.message);
    course.id = data.id;
  } else persistDemo();
  render();
  showToast(`${cleanName} added to your classes.`);
}

async function deleteClass(id) {
  const course = state.data.classes.find((item) => item.id === id);
  state.data.classes = state.data.classes.filter((item) => item.id !== id);
  if (hasSupabase) await supabase.from("classes").delete().eq("id", id);
  else persistDemo();
  render();
  showToast(`${course?.name || "Class"} removed. Existing homework stays in your list.`);
}

async function addAssignment(form) {
  const classId = form.classId === "other" ? null : form.classId;
  const selected = state.data.classes.find((course) => course.id === classId);
  const className = classId ? selected?.name : form.otherClass.trim();
  if (!className || !form.description.trim() || !form.dueDate) {
    showToast("Add a class, a short description, and a due date.");
    return;
  }
  const assignment = {
    id: uid(), classId, className, description: form.description.trim(), dueDate: form.dueDate,
    completed: false, createdAt: new Date().toISOString(),
  };
  state.data.assignments.unshift(assignment);
  if (hasSupabase) {
    const { data, error } = await supabase.from("assignments").insert({
      class_id: classId, class_name: className, description: assignment.description, due_date: assignment.dueDate,
    }).select().single();
    if (error) { state.data.assignments.shift(); return showToast(error.message); }
    assignment.id = data.id;
  } else persistDemo();
  render();
  showToast(hasSupabase ? "Homework saved — it’s queued for your free reminder service." : "Homework saved. Connect the free setup to send reminders.");
}

async function toggleAssignment(id) {
  const assignment = state.data.assignments.find((item) => item.id === id);
  assignment.completed = !assignment.completed;
  if (hasSupabase) {
    await supabase.from("assignments").update({ completed_at: assignment.completed ? new Date().toISOString() : null }).eq("id", id);
  } else persistDemo();
  render();
  showToast(assignment.completed ? "Nice work — marked complete." : "Moved back to your homework list.");
}

async function deleteAssignment(id) {
  state.data.assignments = state.data.assignments.filter((item) => item.id !== id);
  if (hasSupabase) await supabase.from("assignments").delete().eq("id", id);
  else persistDemo();
  render();
  showToast("Homework removed.");
}

function icon(name, size = 20) {
  const paths = {
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2v5M8 2v5M3 10h18"/>',
    settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.32 2.32-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56v.08h-3.28v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.32-2.32.06-.06A1.7 1.7 0 0 0 6.32 15a1.7 1.7 0 0 0-1.56-1.04h-.08v-3.28h.08A1.7 1.7 0 0 0 6.32 9.64a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.32-2.32.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.04-1.56v-.08h3.28v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.32 2.32-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.08v3.28h-.08A1.7 1.7 0 0 0 19.4 15Z"/>',
    check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 14h10l1-14"/>',
    spark: '<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3M13 4h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-5"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

function landingView() {
  const primaryLabel = hasSupabase ? "Get started" : "Preview blank tracker";
  return `
    <section class="landing-shell">
      <nav class="landing-nav"><a class="brand" href="#"><span class="brand-mark">d</span><span>due<span class="brand-dot">.</span></span></a><div>${hasSupabase ? '<button class="text-button" data-action="open-auth">Log in</button>' : ""}<button class="nav-cta" data-action="open-signup">${primaryLabel} ${icon("arrow", 16)}</button></div></nav>
      <div class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">HOMEWORK, REMEMBERED</p>
          <h1>Keep your mind<br>on <em>learning.</em></h1>
          <p class="hero-text">A calm place for every assignment — with the kind of reminders that make deadlines much less surprising.</p>
          <div class="hero-actions"><button class="primary-button" data-action="open-signup">${primaryLabel} ${icon("arrow", 18)}</button><span>${hasSupabase ? "No credit card. Just homework." : "No account is created in preview mode."}</span></div>
          <div class="mini-proof"><div class="avatars"><span>J</span><span>M</span><span>A</span></div><p>Made for students<br>who have a lot going on.</p></div>
        </div>
        <div class="hero-art" aria-label="Preview of the homework planner">
          <div class="sun"></div><div class="checker checker-one"></div><div class="checker checker-two"></div>
          <article class="floating-card due-card"><div class="card-top"><span class="course-dot" style="background:#f5b342"></span><span>English</span><span class="card-more">•••</span></div><h3>Read chapters 9–10</h3><p>Due tomorrow</p><div class="progress-line"><i></i></div></article>
          <article class="floating-card mail-card"><div class="mail-icon">${icon("mail", 17)}</div><div><b>Homework reminder</b><p>English · due tomorrow</p></div></article>
          <article class="floating-card done-card"><span>${icon("check", 17)}</span><div><b>You're on a roll!</b><p>2 tasks completed</p></div></article>
          <div class="big-pencil"><i></i></div>
        </div>
      </div>
      <footer class="landing-footer"><span>ONE PLACE FOR EVERY ASSIGNMENT</span><span class="star">✦</span><span>EMAIL REMINDERS THAT WORK</span><span class="star">✦</span><span>LESS LAST-MINUTE PANIC</span></footer>
    </section>
    ${state.authOpen ? authModal() : ""}`;
}

function authModal() {
  if (!hasSupabase) {
    return `<div class="modal-backdrop"><section class="auth-modal preview-modal" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <button class="close-button" data-action="close-auth" aria-label="Close">${icon("close")}</button>
      <a class="brand auth-brand" href="#"><span class="brand-mark">d</span><span>due<span class="brand-dot">.</span></span></a>
      <p class="eyebrow">LOCAL PREVIEW</p>
      <h2 id="preview-title">Start with a blank slate.</h2>
      <p class="auth-intro">This preview does not create an account or send email. It opens an empty workspace so you can add classes and homework yourself.</p>
      <button class="primary-button full" data-action="open-preview">Open blank tracker ${icon("arrow", 18)}</button>
      <p class="demo-note">Connect the free Supabase setup in the README when you’re ready for real accounts, Google login, and reminders.</p>
    </section></div>`;
  }
  const signup = state.authMode === "signup";
  return `<div class="modal-backdrop"><section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <button class="close-button" data-action="close-auth" aria-label="Close">${icon("close")}</button>
    <a class="brand auth-brand" href="#"><span class="brand-mark">d</span><span>due<span class="brand-dot">.</span></span></a>
    <p class="eyebrow">${signup ? "WELCOME IN" : "GOOD TO SEE YOU"}</p>
    <h2 id="auth-title">${signup ? "Homework, handled." : "Welcome back."}</h2>
    <p class="auth-intro">${signup ? "Start with a free account. You can add your classes in a minute." : "Pick up right where you left off."}</p>
    <div class="oauth-buttons"><button data-auth-provider="google"><span class="google-g">G</span>Continue with Google</button></div>
    <div class="divider"><span>or use your email</span></div>
    <form id="email-auth-form" class="auth-form">
      ${signup ? '<label>Your name<input name="name" type="text" placeholder="Alex Morgan" autocomplete="name" required></label>' : ""}
      <label>Email address<input name="email" type="email" placeholder="you@example.com" autocomplete="email" required></label>
      <label>Password<input name="password" type="password" placeholder="At least 8 characters" autocomplete="current-password" minlength="8" required></label>
      <button class="primary-button full" type="submit">${signup ? "Create my account" : "Log in"} ${icon("arrow", 18)}</button>
    </form>
    <p class="switch-auth">${signup ? "Already have an account?" : "New around here?"} <button data-action="switch-auth">${signup ? "Log in" : "Create one"}</button></p>
  </section></div>`;
}

function navView() {
  const nav = [
    ["home", "Today", "book"], ["homework", "My homework", "calendar"], ["settings", "Settings", "settings"],
  ];
  return `<aside class="sidebar"><a class="brand side-brand" href="#"><span class="brand-mark">d</span><span>due<span class="brand-dot">.</span></span></a>
    <div class="nav-links">${nav.map(([page, label, name]) => `<button class="nav-link ${state.page === page ? "active" : ""}" data-page="${page}">${icon(name, 19)}<span>${label}</span></button>`).join("")}</div>
    <div class="sidebar-bottom"><div class="plan-card"><span class="spark-icon">${icon("spark", 16)}</span><p><b>Small wins count.</b><br>Your homework is in one place now.</p></div><button class="profile-button" data-page="settings"><span class="profile-avatar">${escapeHtml(state.data.profile.name.charAt(0).toUpperCase())}</span><span><b>${escapeHtml(state.data.profile.name)}</b><small>${escapeHtml(state.data.profile.email)}</small></span>${icon("chevron", 16)}</button></div>
  </aside>`;
}

function todayView() {
  const open = state.data.assignments.filter((item) => !item.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const todayItems = open.filter((item) => item.dueDate <= offsetDate(1));
  const completeCount = state.data.assignments.filter((item) => item.completed).length;
  return `<section class="dashboard-page">
    <header class="page-header"><div><p class="greeting">${greeting()}, ${escapeHtml(state.data.profile.name)} <span>✦</span></p><h1>Here’s your plan.</h1><p class="date-line">${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}</p></div><button class="add-button" data-action="focus-add">${icon("plus", 18)} Add homework</button></header>
    <div class="dashboard-layout">
      <div class="today-main">
        <section class="status-banner"><div class="status-symbol">${icon("spark", 22)}</div><div><b>${todayItems.length ? `You've got ${todayItems.length} thing${todayItems.length === 1 ? "" : "s"} coming up.` : "You're all clear for tomorrow."}</b><p>${todayItems.length ? "A little progress now makes the rest of the week easier." : "Use the breathing room to add anything new."}</p></div><div class="status-count"><b>${completeCount}</b><span>completed</span></div></section>
        <section class="section-heading"><div><p class="eyebrow">UP NEXT</p><h2>Things to tackle</h2></div><button class="link-button" data-page="homework">View all ${icon("arrow", 15)}</button></section>
        <div class="assignment-stack">${open.length ? open.slice(0, 4).map(assignmentCard).join("") : emptyState()}</div>
      </div>
      <aside class="right-rail">${quickAddView()}${reminderPreview()}</aside>
    </div>
  </section>`;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function assignmentCard(item) {
  const course = classInfo(item);
  const overdue = item.dueDate < today();
  return `<article class="assignment-card ${item.completed ? "is-complete" : ""}">
    <button class="complete-toggle ${item.completed ? "checked" : ""}" data-toggle-assignment="${item.id}" aria-label="${item.completed ? "Mark incomplete" : "Mark complete"}">${item.completed ? icon("check", 15) : ""}</button>
    <div class="course-line"><span class="course-dot" style="background:${course.color}"></span>${escapeHtml(item.className)}</div>
    <div class="assignment-copy"><h3>${escapeHtml(item.description)}</h3><p class="due-tag ${overdue ? "overdue" : ""}">${icon("calendar", 14)} ${relativeDue(item.dueDate)} · ${spokenDate(item.dueDate, false)}</p></div>
    <button class="card-delete" data-delete-assignment="${item.id}" aria-label="Delete homework">${icon("trash", 16)}</button>
  </article>`;
}

function emptyState() {
  return `<div class="empty-state"><span>${icon("check", 24)}</span><h3>Nothing pressing.</h3><p>Add an assignment whenever a teacher gives you one, and Due will take it from there.</p><button class="outline-button" data-action="focus-add">Add homework</button></div>`;
}

function quickAddView() {
  const firstCourse = state.data.classes[0];
  const selectedClassId = firstCourse?.id || "other";
  const courseOptions = state.data.classes.map((course) => `<option value="${course.id}" ${course.id === selectedClassId ? "selected" : ""}>${escapeHtml(course.name)}</option>`).join("");
  const tomorrow = offsetDate(1);
  const nextWeek = offsetDate(7);
  return `<section class="quick-add" id="quick-add"><div class="quick-title"><span>${icon("plus", 18)}</span><div><p class="eyebrow">QUICK ADD</p><h2>Homework in 10 seconds.</h2></div></div>
    <form id="assignment-form">
      <label>Class<select name="classId" required>${courseOptions}<option value="other" ${selectedClassId === "other" ? "selected" : ""}>Other class…</option></select></label>
      <label class="other-class-field" ${selectedClassId === "other" ? "" : "hidden"}>Class name<input name="otherClass" type="text" placeholder="e.g. Art History" maxlength="80" ${selectedClassId === "other" ? "required" : ""}></label>
      <label>What do you need to do?<input name="description" type="text" placeholder="Read chapter 4, finish a problem set…" maxlength="300" autocomplete="off" required></label>
      <div class="due-picker"><span>When’s it due?</span><div class="due-options"><button type="button" class="due-option selected" data-due-date="${tomorrow}">Tomorrow</button><button type="button" class="due-option" data-due-date="${nextWeek}">Next week</button><button type="button" class="due-option date-option" data-action="pick-date">Pick date</button><input name="dueDate" type="date" min="${today()}" value="${tomorrow}" required aria-label="Choose a due date"></div></div>
      <div class="send-note">${icon("mail", 15)} <span>${state.data.profile.email ? `A reminder goes to ${escapeHtml(state.data.profile.email)}.` : "Connect a real account to turn on email reminders."}</span></div>
      <button class="primary-button full" type="submit">Add homework ${icon("arrow", 17)}</button>
    </form></section>`;
}

function reminderPreview() {
  const daily = state.data.profile.reminderMode === "daily";
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${state.data.profile.reminderTime}`));
  return `<section class="email-preview"><div class="preview-top"><span class="mail-icon small">${icon("mail", 15)}</span><p class="eyebrow">YOUR REMINDERS</p><button data-page="settings">Edit</button></div><h3>${daily ? "A helpful nudge, daily." : "One email per assignment."}</h3><p>${daily ? `We’ll email you at ${time} until each assignment is due.` : "We’ll email you as soon as you add homework."}</p><div class="fake-email"><span>From: <b>Due Today</b></span><span>Subject: <b>(REMINDER) HOMEWORK: English</b></span></div></section>`;
}

function homeworkView() {
  const filters = [["open", "To do"], ["done", "Completed"], ["all", "All homework"]];
  const items = state.data.assignments.filter((item) => state.assignmentFilter === "all" || state.assignmentFilter === "done" ? state.assignmentFilter === "all" || item.completed : !item.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return `<section class="dashboard-page homework-page"><header class="page-header"><div><p class="greeting">YOUR WORKSPACE</p><h1>My homework</h1><p class="date-line">Everything you’ve captured, in one calm list.</p></div><button class="add-button" data-action="focus-add">${icon("plus", 18)} Add homework</button></header>
    <div class="filter-tabs">${filters.map(([key, label]) => `<button class="${state.assignmentFilter === key ? "selected" : ""}" data-filter="${key}">${label}<span>${key === "all" ? state.data.assignments.length : state.data.assignments.filter((item) => key === "done" ? item.completed : !item.completed).length}</span></button>`).join("")}</div>
    <section class="all-homework-list">${items.length ? items.map(assignmentCard).join("") : emptyState()}</section>
  </section>`;
}

function settingsView() {
  const profile = state.data.profile;
  return `<section class="dashboard-page settings-page"><header class="page-header"><div><p class="greeting">MAKE IT YOURS</p><h1>Settings</h1><p class="date-line">Your classes, your inbox, your rhythm.</p></div></header>
    <div class="settings-grid"><div>
      <section class="settings-card"><div class="settings-heading"><span class="settings-icon">${icon("book", 18)}</span><div><h2>Your classes</h2><p>These appear whenever you add homework.</p></div></div>
        <div class="class-pills">${state.data.classes.map((course) => `<span class="class-pill"><i style="background:${course.color}"></i>${escapeHtml(course.name)}<button data-delete-class="${course.id}" aria-label="Remove ${escapeHtml(course.name)}">×</button></span>`).join("") || '<p class="muted">No classes yet — add your first one below.</p>'}</div>
        <form id="class-form" class="inline-form"><input name="className" maxlength="80" placeholder="Add a class (for example, World History)" required><button type="submit">${icon("plus", 16)} Add class</button></form>
      </section>
      <section class="settings-card"><div class="settings-heading"><span class="settings-icon">${icon("mail", 18)}</span><div><h2>Email reminders</h2><p>We’ll only send homework notes you asked for.</p></div></div>
        <form id="reminder-form" class="settings-form"><label>Send reminders at <input name="reminderTime" type="time" value="${profile.reminderTime}"></label><label>Your time zone <input name="timezone" type="text" value="${escapeHtml(profile.timezone)}" maxlength="80"></label><div class="choice-row"><label class="choice ${profile.reminderMode === "daily" ? "selected" : ""}"><input name="reminderMode" type="radio" value="daily" ${profile.reminderMode === "daily" ? "checked" : ""}><span><b>Every day until it’s due</b><small>Starts with the first homework email. Reminders say “(REMINDER)”.</small></span></label><label class="choice ${profile.reminderMode === "once" ? "selected" : ""}"><input name="reminderMode" type="radio" value="once" ${profile.reminderMode === "once" ? "checked" : ""}><span><b>One email per assignment</b><small>We’ll send it when you add the homework, then stay quiet.</small></span></label></div><button class="outline-button save-button" type="submit">Save reminder preferences</button></form>
      </section></div>
      <aside><section class="settings-card inbox-card"><span class="spark-icon">${icon("spark", 18)}</span><h2>Make an inbox folder</h2><p>Keep school reminders out of the noise with a simple mail rule.</p><ol><li>Create a folder or label named <b>Homework</b>.</li><li>Make a rule for messages whose subject contains <code>HOMEWORK</code>.</li><li>Move matching messages to that folder.</li></ol><button class="link-button" data-action="show-onboarding">See the full setup guide ${icon("arrow", 15)}</button></section><button class="logout-button" data-action="logout">${icon("logout", 17)} Log out</button></aside>
    </div>
  </section>`;
}

function onboardingModal() {
  return `<div class="modal-backdrop onboarding-backdrop"><section class="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div class="onboarding-art"><span class="onboard-star s1">✦</span><span class="onboard-star s2">✦</span><div class="onboard-mail">${icon("mail", 36)}</div></div><p class="eyebrow">A SMALL SETUP, A CLEARER INBOX</p><h2 id="setup-title">Let’s give homework<br>its own corner.</h2><p class="onboard-intro">Due sends useful reminders. A quick email rule keeps them organized and easy to find.</p><div class="setup-steps"><div><span>1</span><p><b>Make a “Homework” folder or label</b><br>Use whatever your email app calls it — folder, label, or category.</p></div><div><span>2</span><p><b>Create a mail rule</b><br>Choose messages where the subject <strong>contains “HOMEWORK”</strong>.</p></div><div><span>3</span><p><b>Move those messages into Homework</b><br>That’s it. Your future self will be grateful.</p></div></div><div class="onboarding-classes"><div><b>Add your classes</b><span>These appear in your homework menu. You can change them later in Settings.</span></div><div class="onboarding-pills">${state.data.classes.map((course) => `<span><i style="background:${course.color}"></i>${escapeHtml(course.name)}</span>`).join("") || '<small>No classes added yet.</small>'}</div><form id="onboarding-class-form"><input name="className" maxlength="80" placeholder="e.g. English" required><button type="submit" aria-label="Add class">${icon("plus", 16)}</button></form></div><button class="primary-button full" data-action="finish-onboarding">Finish setup ${icon("arrow", 18)}</button><button class="quiet-button" data-action="finish-onboarding">I’ll add classes later</button></section></div>`;
}

function appView() {
  const page = state.page === "settings" ? settingsView() : state.page === "homework" ? homeworkView() : todayView();
  return `<div class="app-shell">${navView()}<main class="main-content">${page}</main><nav class="mobile-nav"><button data-page="home" class="${state.page === "home" ? "active" : ""}">${icon("book", 19)}<span>Today</span></button><button data-page="homework" class="${state.page === "homework" ? "active" : ""}">${icon("calendar", 19)}<span>Homework</span></button><button data-page="settings" class="${state.page === "settings" ? "active" : ""}">${icon("settings", 19)}<span>Settings</span></button></nav></div>${state.onboardingOpen ? onboardingModal() : ""}`;
}

function render() {
  if (state.loading) app.innerHTML = '<div class="loading-screen"><span class="brand-mark">d</span><p>Opening your plan…</p></div>';
  else app.innerHTML = state.user ? appView() : landingView();
  if (state.toast) app.insertAdjacentHTML("beforeend", `<div class="toast">${icon("check", 16)} ${escapeHtml(state.toast)}</div>`);
}

async function submitAuth(form) {
  const data = new FormData(form);
  const email = String(data.get("email") || "").trim();
  const password = String(data.get("password") || "");
  if (hasSupabase) {
    const result = state.authMode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: String(data.get("name") || "").trim() } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return showToast(result.error.message);
    if (state.authMode === "signup" && !result.data.session) return showToast("Check your email to confirm your account, then log in.");
    if (result.data.user) await enterApp(result.data.user);
  }
}

async function authProvider(provider) {
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + window.location.pathname } });
  if (error) showToast(error.message);
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-page]");
  if (!target) return;
  if (target.dataset.page) { state.page = target.dataset.page; render(); return; }
  const action = target.dataset.action;
  if (action === "open-auth") { state.authOpen = true; state.authMode = "signin"; render(); }
  if (action === "open-signup") { state.authOpen = true; state.authMode = "signup"; render(); }
  if (action === "open-preview") { state.data = defaultData(); await enterApp({ id: "local-preview", email: "" }); }
  if (action === "close-auth") { state.authOpen = false; render(); }
  if (action === "switch-auth") { state.authMode = state.authMode === "signup" ? "signin" : "signup"; render(); }
  if (action === "focus-add") { state.page = "home"; render(); window.setTimeout(() => document.querySelector("#quick-add input[name=description]")?.focus(), 50); }
  if (target.dataset.dueDate) {
    const form = target.closest("form");
    form.elements.dueDate.value = target.dataset.dueDate;
    form.querySelectorAll(".due-option").forEach((option) => option.classList.toggle("selected", option === target));
  }
  if (action === "pick-date") {
    const dateField = target.closest("form").elements.dueDate;
    dateField.focus();
    dateField.showPicker?.();
  }
  if (action === "show-onboarding") { state.onboardingOpen = true; render(); }
  if (action === "finish-onboarding") { state.onboardingOpen = false; await saveProfile({ onboardingDone: true }); render(); }
  if (action === "logout") {
    if (hasSupabase) await supabase.auth.signOut();
    state.user = null; state.authOpen = false; render();
  }
  if (target.dataset.toggleAssignment) await toggleAssignment(target.dataset.toggleAssignment);
  if (target.dataset.deleteAssignment) await deleteAssignment(target.dataset.deleteAssignment);
  if (target.dataset.deleteClass) await deleteClass(target.dataset.deleteClass);
  if (target.dataset.filter) { state.assignmentFilter = target.dataset.filter; render(); }
  if (target.dataset.authProvider) await authProvider(target.dataset.authProvider);
});

document.addEventListener("change", (event) => {
  if (event.target.name === "classId") {
    const other = event.target.form.querySelector(".other-class-field");
    other.hidden = event.target.value !== "other";
    other.querySelector("input").required = event.target.value === "other";
  }
  if (event.target.name === "reminderMode") {
    event.target.closest(".choice-row").querySelectorAll(".choice").forEach((item) => item.classList.toggle("selected", item.querySelector("input").checked));
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id === "email-auth-form") { event.preventDefault(); await submitAuth(event.target); }
  if (event.target.id === "assignment-form") { event.preventDefault(); const form = new FormData(event.target); await addAssignment({ classId: form.get("classId"), otherClass: form.get("otherClass") || "", description: form.get("description"), dueDate: form.get("dueDate") }); }
  if (event.target.id === "class-form") { event.preventDefault(); const input = event.target.elements.className; await addClass(input.value); input.value = ""; }
  if (event.target.id === "onboarding-class-form") { event.preventDefault(); const input = event.target.elements.className; await addClass(input.value); }
  if (event.target.id === "reminder-form") { event.preventDefault(); const form = new FormData(event.target); await saveProfile({ reminderTime: form.get("reminderTime"), timezone: String(form.get("timezone")).trim() || "America/New_York", reminderMode: form.get("reminderMode") }); showToast("Reminder preferences saved."); }
});

document.addEventListener("keydown", (event) => {
  const form = event.target.closest?.("#assignment-form");
  if (form && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    form.requestSubmit();
  }
});

initialise();
