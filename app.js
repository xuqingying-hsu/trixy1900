const fallbackMembers = [
  {
    id: "jiangduyi",
    name: "江都夷",
    role: "社主",
    avatar: "assets/jiangduyi.png",
    portrait: "assets/jiangduyi-portrait.png",
    tags: ["见道修", "涅槃港", "执灯领港"],
    quote: "知我罪我，其惟春秋。"
  },
  {
    id: "shengyang",
    name: "晟楊",
    role: "副社主",
    avatar: "assets/jiangduyi.png",
    portrait: "",
    tags: ["副社主", "同袍", "掌舵"],
    quote: "风起时并肩，潮落处守港。"
  }
];

const cycleMs = 5200;
let members = [];
let activeIndex = 0;
let timer = null;
let paused = false;
const placeholderImage = "assets/member-placeholder.png";

const stage = document.querySelector("#memberStage");
const portrait = document.querySelector("#memberPortrait");
const nameEl = document.querySelector("#memberName");
const roleEl = document.querySelector("#memberRole");
const quoteEl = document.querySelector("#memberQuote");
const tagsEl = document.querySelector("#memberTags");
const rosterEl = document.querySelector("#memberRoster");
const rosterCountEl = document.querySelector("#rosterCount");
const memberIndexEl = document.querySelector("#memberIndex");
const memberTotalEl = document.querySelector("#memberTotal");
const progressEl = document.querySelector("#cycleProgress");
const directoryOpen = document.querySelector("#directoryOpen");
const directoryPanel = document.querySelector("#directoryPanel");
const directoryClose = document.querySelector("#directoryClose");
const directorySearch = document.querySelector("#directorySearch");
const directoryGrid = document.querySelector("#directoryGrid");
const alumniOpen = document.querySelector("#alumniOpen");
const alumniPanel = document.querySelector("#alumniPanel");
const alumniClose = document.querySelector("#alumniClose");
const alumniGrid = document.querySelector("#alumniGrid");
const adminOpen = document.querySelector("#adminOpen");
const adminPanel = document.querySelector("#adminPanel");
const adminClose = document.querySelector("#adminClose");
const adminAdd = document.querySelector("#adminAdd");
const adminForm = document.querySelector("#adminForm");
const adminMemberList = document.querySelector("#adminMemberList");
const adminName = document.querySelector("#adminName");
const adminRole = document.querySelector("#adminRole");
const adminStatusType = document.querySelector("#adminStatusType");
const adminTags = document.querySelector("#adminTags");
const adminQuote = document.querySelector("#adminQuote");
const adminAvatar = document.querySelector("#adminAvatar");
const adminPortrait = document.querySelector("#adminPortrait");
const adminDelete = document.querySelector("#adminDelete");
const adminExport = document.querySelector("#adminExport");
const adminPublish = document.querySelector("#adminPublish");
const adminStatus = document.querySelector("#adminStatus");
const githubToken = document.querySelector("#githubToken");
const selfOpen = document.querySelector("#selfOpen");
const selfPanel = document.querySelector("#selfPanel");
const selfClose = document.querySelector("#selfClose");
const selfEmail = document.querySelector("#selfEmail");
const selfPassword = document.querySelector("#selfPassword");
const selfLogin = document.querySelector("#selfLogin");
const selfSignup = document.querySelector("#selfSignup");
const selfLogout = document.querySelector("#selfLogout");
const selfAuthStatus = document.querySelector("#selfAuthStatus");
const selfForm = document.querySelector("#selfForm");
const selfName = document.querySelector("#selfName");
const selfRole = document.querySelector("#selfRole");
const selfStatusType = document.querySelector("#selfStatusType");
const selfTags = document.querySelector("#selfTags");
const selfQuote = document.querySelector("#selfQuote");
const selfAvatar = document.querySelector("#selfAvatar");
const selfPortrait = document.querySelector("#selfPortrait");
const selfSave = document.querySelector("#selfSave");
const selfSaveStatus = document.querySelector("#selfSaveStatus");
const siteBgm = document.querySelector("#siteBgm");
const musicToggle = document.querySelector("#musicToggle");
let audioContext = null;
let musicNodes = [];
let musicTimers = [];
let musicOn = false;
let musicUnlocked = false;
let musicUserPaused = false;
let bgmFileFailed = false;
let bgmTrackIndex = 0;
let lastMusicToggleAt = 0;
const bgmCheckedSources = new Set();
const bgmFailedSources = new Set();
let adminIndex = 0;
let directoryQuery = "";

const localMembersKey = "nirvana-harbor-members";
const alumniNameOverrides = new Set(["戎袼"]);
const repoConfig = {
  owner: "nirvana-harbor",
  repo: "trixy1900",
  branch: "main"
};
const supabaseConfig = window.NIRVANA_SUPABASE || {};
let supabaseClient = null;
let selfSession = null;
let selfProfile = null;

function hasSupabaseConfig() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase);
}

function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey);
  }

  return supabaseClient;
}

function normalizeMemberName(name) {
  const value = typeof name === "string" ? name.trim() : "";
  if (value === "晟杨") {
    return "晟楊";
  }
  return value || "未命名成员";
}

function normalizeMemberRole(role) {
  const value = typeof role === "string" ? role.trim() : "";
  if (!value || value === "港内成员") {
    return "社众";
  }
  return value;
}

function normalizeMemberStatus(status, name = "") {
  if (alumniNameOverrides.has(name)) {
    return "alumni";
  }
  return status === "alumni" ? "alumni" : "active";
}

function normalizeMember(member) {
  const name = normalizeMemberName(member?.name);
  return {
    ...member,
    name,
    role: normalizeMemberRole(member?.role),
    status: normalizeMemberStatus(member?.status, name)
  };
}

function memberPinRank(member) {
  if (member?.status === "alumni") {
    return 10;
  }
  if (member?.name === "江都夷") {
    return 0;
  }
  if (member?.name === "晟楊") {
    return 1;
  }
  return 10;
}

function sortMembersForDisplay(memberList) {
  return memberList
    .map((member, index) => ({ member, index, rank: memberPinRank(member) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ member }) => member);
}

function normalizeMembers(memberList) {
  return sortMembersForDisplay(memberList.map(normalizeMember));
}

async function loadMembers() {
  try {
    const cloudMembers = await loadMembersFromSupabase();
    if (cloudMembers) {
      return normalizeMembers(cloudMembers);
    }

    const localMembers = readLocalMembers();
    if (localMembers) {
      return normalizeMembers(localMembers);
    }

    const response = await fetch("data/members.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`members.json returned ${response.status}`);
    }

    const data = await response.json();
    const sourceMembers = Array.isArray(data.members) && data.members.length ? data.members : fallbackMembers;
    return normalizeMembers(sourceMembers);
  } catch (error) {
    console.warn("Using built-in member data:", error);
    return normalizeMembers(fallbackMembers);
  }
}

async function loadMembersFromSupabase() {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(supabaseConfig.membersTable || "members")
    .select("id, name, role, status, avatar, portrait, tags, quote, sort_order, created_at")
    .in("status", ["active", "alumni"])
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Supabase members unavailable:", error);
    return null;
  }

  return Array.isArray(data) && data.length ? data.map(memberFromSupabase) : null;
}

function memberFromSupabase(row) {
  return {
    id: row.id,
    name: row.name || "未命名成员",
    role: row.role || "社众",
    avatar: row.avatar || placeholderImage,
    portrait: row.portrait || "",
    status: normalizeMemberStatus(row.status),
    tags: Array.isArray(row.tags) ? row.tags : [],
    quote: row.quote || "长风入港，同赴涅槃。"
  };
}

function readLocalMembers() {
  try {
    const saved = localStorage.getItem(localMembersKey);
    if (!saved) {
      return null;
    }
    const data = JSON.parse(saved);
    return Array.isArray(data.members) && data.members.length ? data.members : null;
  } catch (error) {
    console.warn("Local member data is invalid:", error);
    return null;
  }
}

function saveLocalMembers() {
  localStorage.setItem(localMembersKey, JSON.stringify({ members }));
}

function imageFor(member) {
  return member.portrait || member.avatar || placeholderImage;
}

function activeMembers() {
  return members.filter((member) => member.status !== "alumni");
}

function alumniMembers() {
  return members.filter((member) => member.status === "alumni");
}

function globalIndexForActive(activeIndexValue) {
  const active = activeMembers();
  const member = active[activeIndexValue];
  return member ? members.indexOf(member) : 0;
}

function activePositionForMember(index) {
  const member = members[index];
  if (!member || member.status === "alumni") {
    return -1;
  }
  return activeMembers().findIndex((activeMember) => members.indexOf(activeMember) === index);
}

function renderRoster() {
  rosterEl.innerHTML = "";
  const active = activeMembers();
  rosterCountEl.textContent = String(active.length).padStart(2, "0");
  memberTotalEl.textContent = `/ ${String(active.length).padStart(2, "0")}`;

  getFeaturedMemberIndexes().forEach((index) => {
    const member = members[index];
    const card = document.createElement("button");
    card.className = `member-card${index === activeIndex ? " is-active" : ""}`;
    card.type = "button";
    card.dataset.index = index;
    card.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    card.setAttribute("aria-label", `查看 ${member.name}`);

    const avatar = document.createElement("img");
    avatar.src = member.avatar || imageFor(member);
    avatar.alt = `${member.name}头像`;
    avatar.loading = "lazy";
    avatar.onerror = () => {
      avatar.src = placeholderImage;
    };

    const text = document.createElement("span");
    text.innerHTML = `
      <strong>${escapeHtml(member.name)}</strong>
      <span>${escapeHtml(member.role)}</span>
      <small>${escapeHtml((member.tags || []).slice(0, 2).join(" · "))}</small>
    `;

    card.append(avatar, text);
    card.addEventListener("click", () => {
      setActive(index, true);
    });
    card.addEventListener("mouseenter", pauseCycle);
    card.addEventListener("mouseleave", resumeCycle);
    rosterEl.append(card);
  });

  renderDirectory();
  renderAlumni();
}

function getFeaturedMemberIndexes(limit = 10) {
  const active = activeMembers();
  if (active.length <= limit) {
    return active.map((member) => members.indexOf(member));
  }

  const currentGlobal = activeIndex;
  const currentActive = Math.max(0, active.findIndex((member) => members.indexOf(member) === currentGlobal));
  const indexes = [members.indexOf(active[currentActive])];
  let offset = 1;
  while (indexes.length < limit && offset < active.length) {
    indexes.push(members.indexOf(active[(currentActive + offset) % active.length]));
    if (indexes.length < limit) {
      indexes.push(members.indexOf(active[(currentActive - offset + active.length) % active.length]));
    }
    offset += 1;
  }
  return [...new Set(indexes)].slice(0, limit);
}

function renderDirectory() {
  if (!directoryGrid) {
    return;
  }

  const query = directoryQuery.trim().toLowerCase();
  directoryGrid.innerHTML = "";
  members
    .map((member, index) => ({ member, index }))
    .filter(({ member }) => member.status !== "alumni")
    .filter(({ member }) => {
      if (!query) {
        return true;
      }
      return [member.name, member.role, ...(member.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .forEach(({ member, index }) => {
      const card = document.createElement("button");
      card.className = `directory-card${index === activeIndex ? " is-active" : ""}`;
      card.type = "button";
      card.innerHTML = `
        <img src="${escapeHtml(member.avatar || imageFor(member))}" alt="">
        <span>
          <strong>${escapeHtml(member.name)}</strong>
          <span>${escapeHtml(member.role)}</span>
          <small>${escapeHtml((member.tags || []).slice(0, 2).join(" · "))}</small>
        </span>
      `;
      card.addEventListener("click", () => {
        setActive(index, true);
        closeDirectory();
      });
      directoryGrid.append(card);
    });

  if (!directoryGrid.children.length) {
    const empty = document.createElement("p");
    empty.className = "directory-empty";
    empty.textContent = "没有匹配的成员";
    directoryGrid.append(empty);
  }
}

function renderAlumni() {
  if (!alumniGrid) {
    return;
  }

  alumniGrid.innerHTML = "";
  alumniMembers().forEach((member) => {
    const index = members.indexOf(member);
    const card = document.createElement("button");
    card.className = "directory-card alumni-card";
    card.type = "button";
    card.setAttribute("aria-label", `查看旧友 ${member.name} 的角色展示`);
    card.innerHTML = `
      <img src="${escapeHtml(imageFor(member))}" alt="${escapeHtml(member.name)}角色展示">
      <span>
        <strong>${escapeHtml(member.name)}</strong>
        <span>${escapeHtml(member.role || "旧友成员")}</span>
        <small>${escapeHtml((member.tags || ["旧友"]).slice(0, 2).join(" · "))}</small>
        <em>点击查看角色展示</em>
      </span>
    `;
    card.addEventListener("click", () => {
      setActive(index, true, { allowAlumni: true });
      alumniPanel.classList.remove("is-open");
      alumniPanel.setAttribute("aria-hidden", "true");
    });
    alumniGrid.append(card);
  });

  if (!alumniGrid.children.length) {
    const empty = document.createElement("p");
    empty.className = "directory-empty";
    empty.textContent = "旧友录暂未收录成员";
    alumniGrid.append(empty);
  }
}

function refreshShowcase(index = activeIndex) {
  renderRoster();
  renderAdminList();
  setActive(Math.min(index, members.length - 1));
}

function setActive(index, userInitiated = false, options = {}) {
  if (!members.length) {
    return;
  }

  const active = activeMembers();
  if (!active.length && !options.allowAlumni) {
    return;
  }

  const requestedMember = members[index];
  const member = requestedMember && (options.allowAlumni || requestedMember.status !== "alumni")
    ? requestedMember
    : active[((index % active.length) + active.length) % active.length];
  activeIndex = members.indexOf(member);
  const memberImage = imageFor(member);

  portrait.classList.add("is-switching");
  window.setTimeout(() => {
    document.documentElement.style.setProperty("--active-portrait", `url("${memberImage.replaceAll('"', '\\"')}")`);
    nameEl.textContent = member.name;
    roleEl.textContent = member.role;
    quoteEl.textContent = member.quote || "长风入港，同赴涅槃。";
    const activePosition = activePositionForMember(activeIndex);
    memberIndexEl.textContent = activePosition >= 0
      ? String(activePosition + 1).padStart(2, "0")
      : "旧友";

    tagsEl.innerHTML = "";
    (member.tags || []).forEach((tag) => {
      const tagEl = document.createElement("span");
      tagEl.textContent = tag;
      tagsEl.append(tagEl);
    });

    portrait.src = memberImage;
    portrait.alt = `${member.name}角色形象`;
    portrait.onerror = () => {
      portrait.src = placeholderImage;
    };

    document.querySelectorAll(".member-card").forEach((card, cardIndex) => {
      const index = Number(card.dataset.index);
      card.classList.toggle("is-active", index === activeIndex);
      card.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
    renderDirectory();
    if (!userInitiated && member.status !== "alumni" && members.length > 8) {
      renderRoster();
    }

    window.setTimeout(() => portrait.classList.remove("is-switching"), 60);
    restartProgress();
  }, 220);

  if (userInitiated && member.status !== "alumni") {
    restartCycle();
  } else if (userInitiated) {
    pauseCycle();
  }
}

function startCycle() {
  stopCycle();
  if (paused || activeMembers().length < 2) {
    return;
  }
  timer = window.setInterval(() => {
    const active = activeMembers();
    const activePosition = Math.max(0, active.findIndex((member) => members.indexOf(member) === activeIndex));
    setActive(members.indexOf(active[(activePosition + 1) % active.length]));
  }, cycleMs);
  restartProgress();
}

function stopCycle() {
  if (timer) {
    window.clearInterval(timer);
    timer = null;
  }
}

function pauseCycle() {
  paused = true;
  stopCycle();
  progressEl.classList.remove("is-running");
}

function resumeCycle() {
  paused = false;
  startCycle();
}

function restartCycle() {
  stopCycle();
  startCycle();
}

function restartProgress() {
  progressEl.classList.remove("is-running");
  progressEl.style.width = "0%";
  void progressEl.offsetWidth;
  progressEl.style.width = "";
  if (!paused && activeMembers().length > 1) {
    progressEl.classList.add("is-running");
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

function openAdmin() {
  adminPanel.classList.add("is-open");
  adminPanel.setAttribute("aria-hidden", "false");
  adminIndex = Math.min(activeIndex, members.length - 1);
  renderAdminList();
  fillAdminForm();
}

function closeAdmin() {
  adminPanel.classList.remove("is-open");
  adminPanel.setAttribute("aria-hidden", "true");
}

function openDirectory() {
  directoryPanel.classList.add("is-open");
  directoryPanel.setAttribute("aria-hidden", "false");
  renderDirectory();
  directorySearch.focus();
}

function closeDirectory() {
  directoryPanel.classList.remove("is-open");
  directoryPanel.setAttribute("aria-hidden", "true");
}

function openSelfPanel() {
  selfPanel.classList.add("is-open");
  selfPanel.setAttribute("aria-hidden", "false");
  refreshSelfAuth();
}

function closeSelfPanel() {
  selfPanel.classList.remove("is-open");
  selfPanel.setAttribute("aria-hidden", "true");
}

function setSelfAuthStatus(message) {
  selfAuthStatus.textContent = message;
}

function setSelfSaveStatus(message) {
  selfSaveStatus.textContent = message;
}

async function refreshSelfAuth() {
  const client = getSupabaseClient();
  if (!client) {
    setSelfAuthStatus("云端后台尚未配置。请先在 config.js 填入 Supabase URL 和 anon key。");
    setSelfSaveStatus("配置完成并发布后，成员就能在这里上传自己的资料。");
    selfForm.classList.add("is-disabled");
    selfSave.disabled = true;
    return;
  }

  const { data } = await client.auth.getSession();
  selfSession = data.session;
  selfSave.disabled = !selfSession;
  selfForm.classList.toggle("is-disabled", !selfSession);

  if (!selfSession) {
    selfProfile = null;
    fillSelfForm();
    setSelfAuthStatus("请先登录或注册。");
    return;
  }

  setSelfAuthStatus(`已登录：${selfSession.user.email}`);
  await loadSelfProfile();
}

async function loadSelfProfile() {
  const client = getSupabaseClient();
  if (!client || !selfSession) {
    return;
  }

  const { data, error } = await client
    .from(supabaseConfig.membersTable || "members")
    .select("id, slug, name, role, status, avatar, portrait, tags, quote")
    .eq("owner_id", selfSession.user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Self profile unavailable:", error);
    setSelfSaveStatus("读取你的资料失败，请稍后再试。");
    return;
  }

  selfProfile = data;
  fillSelfForm();
  if (selfProfile) {
    setSelfSaveStatus(selfProfile.status === "pending" ? "你的资料还在待审核；重新保存一次后会自动公开。" : "你的资料已在云端保存。");
  } else {
    setSelfSaveStatus("还没有资料，填写后保存会自动公开到名册。");
  }
}

function fillSelfForm() {
  selfName.value = selfProfile?.name || "";
  selfRole.value = selfProfile?.role || "社众";
  if (selfStatusType) {
    selfStatusType.value = normalizeMemberStatus(selfProfile?.status, normalizeMemberName(selfProfile?.name));
  }
  selfTags.value = Array.isArray(selfProfile?.tags) ? selfProfile.tags.join("，") : "";
  selfQuote.value = selfProfile?.quote || "";
  selfAvatar.value = "";
  selfPortrait.value = "";
}

function isAutoPublishPolicyError(error) {
  const message = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`.toLowerCase();
  return message.includes("policy") || message.includes("row-level security") || message.includes("violates");
}

async function signInSelf() {
  const client = getSupabaseClient();
  if (!client) {
    await refreshSelfAuth();
    return;
  }

  const email = selfEmail.value.trim();
  const password = selfPassword.value;
  if (!email || !password) {
    setSelfAuthStatus("请填写邮箱和密码。");
    return;
  }

  selfLogin.disabled = true;
  setSelfAuthStatus("正在登录...");
  const { error } = await client.auth.signInWithPassword({ email, password });
  selfLogin.disabled = false;
  if (error) {
    setSelfAuthStatus(`登录失败：${error.message}`);
    return;
  }
  await refreshSelfAuth();
}

async function signUpSelf() {
  const client = getSupabaseClient();
  if (!client) {
    await refreshSelfAuth();
    return;
  }

  const email = selfEmail.value.trim();
  const password = selfPassword.value;
  if (!email || password.length < 6) {
    setSelfAuthStatus("请填写邮箱，密码至少 6 位。");
    return;
  }

  selfSignup.disabled = true;
  setSelfAuthStatus("正在注册...");
  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`
    }
  });
  selfSignup.disabled = false;
  if (error) {
    setSelfAuthStatus(`注册失败：${friendlyAuthError(error.message)}`);
    return;
  }
  setSelfAuthStatus("注册成功。如果 Supabase 开启了邮箱验证，请先到邮箱确认。");
  await refreshSelfAuth();
}

function friendlyAuthError(message = "") {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("already registered") || lowerMessage.includes("already been registered")) {
    return "这个邮箱已经注册过，请直接点“登录”。";
  }
  if (lowerMessage.includes("invalid api key") || lowerMessage.includes("api key")) {
    return "Supabase key 不正确，请重新复制 publishable 或 anon public key。";
  }
  if (lowerMessage.includes("signup") && lowerMessage.includes("disabled")) {
    return "Supabase 里关闭了注册，请到 Authentication 开启 Sign ups。";
  }
  if (lowerMessage.includes("password") || lowerMessage.includes("weak")) {
    return "密码不符合要求，请使用至少 6 位，并尽量包含字母和数字。";
  }
  if (lowerMessage.includes("email") && lowerMessage.includes("invalid")) {
    return "邮箱格式不正确，请换一个真实邮箱。";
  }
  if (lowerMessage.includes("confirmation") || lowerMessage.includes("confirm") || lowerMessage.includes("mail")) {
    return "确认邮件发送失败。可以先在 Supabase 的 Email 设置里关闭 Confirm email，或配置 SMTP 邮件服务。";
  }
  if (lowerMessage.includes("rate limit")) {
    return "请求太频繁，等几分钟后再试。";
  }
  if (lowerMessage.includes("failed to fetch") || lowerMessage.includes("networkerror")) {
    return "浏览器没有连上 Supabase。请先确认能打开 https://yyznfmtngkcdfqcbxacn.supabase.co/auth/v1/settings；如果打不开，换网络或开启代理后再试。";
  }
  return message || "未知错误，请检查 Supabase Auth 设置。";
}

async function signOutSelf() {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
  await refreshSelfAuth();
}

async function saveSelfProfile(event) {
  event.preventDefault();
  const client = getSupabaseClient();
  if (!client || !selfSession) {
    setSelfSaveStatus("请先登录。");
    return;
  }

  const name = selfName.value.trim();
  if (!name) {
    setSelfSaveStatus("请填写游戏 ID。");
    return;
  }

  selfSave.disabled = true;
  setSelfSaveStatus("正在上传资料...");

  try {
    let avatar = selfProfile?.avatar || "";
    let portrait = selfProfile?.portrait || "";
    if (selfAvatar.files[0]) {
      avatar = await uploadMemberImage(selfAvatar.files[0], "avatar");
    }
    if (selfPortrait.files[0]) {
      portrait = await uploadMemberImage(selfPortrait.files[0], "portrait");
    }

    const payload = {
      owner_id: selfSession.user.id,
      slug: selfProfile?.slug || `${slugify(name)}-${selfSession.user.id.slice(0, 8)}`,
      name,
      role: normalizeMemberRole(selfRole.value),
      status: normalizeMemberStatus(selfStatusType?.value, normalizeMemberName(name)),
      avatar,
      portrait,
      tags: parseTags(selfTags.value),
      quote: selfQuote.value.trim()
    };

    let usedPendingFallback = false;
    let result = selfProfile?.id
      ? await client.from(supabaseConfig.membersTable || "members").update(payload).eq("id", selfProfile.id).select().single()
      : await client.from(supabaseConfig.membersTable || "members").insert(payload).select().single();

    if (result.error && !selfProfile?.id && payload.status === "active" && isAutoPublishPolicyError(result.error)) {
      usedPendingFallback = true;
      result = await client
        .from(supabaseConfig.membersTable || "members")
        .insert({ ...payload, status: "pending" })
        .select()
        .single();
    }

    if (result.error) {
      throw result.error;
    }

    selfProfile = result.data;
    fillSelfForm();
    setSelfSaveStatus(
      result.data.status === "pending"
        ? (usedPendingFallback ? "已保存；数据库还未开启自动公开，请社主执行最新 SQL。" : "已保存；数据库规则更新后会自动公开。")
        : "已保存，网页刷新后会同步最新资料。"
    );
    await reloadCloudMembers();
  } catch (error) {
    console.error(error);
    setSelfSaveStatus(`保存失败：${error.message}`);
  } finally {
    selfSave.disabled = false;
  }
}

async function uploadMemberImage(file, kind) {
  const client = getSupabaseClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${selfSession.user.id}/${kind}-${Date.now()}.${ext}`;
  const { error } = await client.storage
    .from(supabaseConfig.storageBucket || "member-portraits")
    .upload(path, file, { cacheControl: "31536000", upsert: true });

  if (error) {
    throw error;
  }

  const { data } = client.storage
    .from(supabaseConfig.storageBucket || "member-portraits")
    .getPublicUrl(path);
  return data.publicUrl;
}

async function reloadCloudMembers() {
  const cloudMembers = await loadMembersFromSupabase();
  if (!cloudMembers) {
    return;
  }

  members = cloudMembers;
  refreshShowcase(Math.min(activeIndex, members.length - 1));
}

function renderAdminList() {
  if (!adminMemberList) {
    return;
  }

  adminMemberList.innerHTML = "";
  members.forEach((member, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `admin-member-button${index === adminIndex ? " is-active" : ""}`;
    item.innerHTML = `
      <img src="${escapeHtml(member.avatar || imageFor(member))}" alt="">
      <strong>${escapeHtml(member.name)}</strong>
      <span>${escapeHtml(member.role)}</span>
    `;
    item.addEventListener("click", () => {
      adminIndex = index;
      renderAdminList();
      fillAdminForm();
    });
    adminMemberList.append(item);
  });
}

function fillAdminForm() {
  const member = members[adminIndex] || createBlankMember();
  adminName.value = member.name || "";
  adminRole.value = member.role || "";
  adminStatusType.value = member.status === "alumni" ? "alumni" : "active";
  adminTags.value = (member.tags || []).join("，");
  adminQuote.value = member.quote || "";
  adminAvatar.value = "";
  adminPortrait.value = "";
}

function createBlankMember() {
  return {
    id: `member-${Date.now().toString(36)}`,
    name: "新成员",
    role: "社众",
    avatar: placeholderImage,
    portrait: "",
    status: "active",
    tags: ["涅槃港"],
    quote: "长风入港，同赴涅槃。"
  };
}

function memberFromForm(existing) {
  return {
    ...existing,
    id: existing.id || slugify(adminName.value || "member"),
    name: adminName.value.trim(),
    role: normalizeMemberRole(adminRole.value),
    status: adminStatusType.value,
    tags: parseTags(adminTags.value),
    quote: adminQuote.value.trim()
  };
}

function parseTags(value) {
  return String(value || "")
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function slugify(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `member-${Date.now().toString(36)}`;
}

async function fileToDataUrl(file, maxWidth, quality = 0.86) {
  if (!file) {
    return "";
  }

  const rawUrl = await readFileAsDataUrl(file);
  const img = await loadImage(rawUrl);
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downloadMembersJson() {
  const blob = new Blob([JSON.stringify({ members }, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "members.json";
  link.click();
  URL.revokeObjectURL(url);
}

function setAdminStatus(message) {
  adminStatus.textContent = message;
}

async function publishToGithub() {
  const token = githubToken.value.trim();
  if (!token) {
    setAdminStatus("请先粘贴 GitHub token。需要 repo contents 读写权限。");
    return;
  }

  adminPublish.disabled = true;
  setAdminStatus("正在准备图片和名册数据...");

  try {
    const publishedMembers = [];
    for (const member of members) {
      const cleanMember = { ...member };
      cleanMember.id = cleanMember.id || slugify(cleanMember.name);

      if (isDataUrl(cleanMember.avatar)) {
        const avatarPath = `assets/members/${cleanMember.id}-avatar.jpg`;
        await putGithubFile(token, avatarPath, dataUrlBase64(cleanMember.avatar), `Update ${cleanMember.name} avatar`);
        cleanMember.avatar = avatarPath;
      }

      if (isDataUrl(cleanMember.portrait)) {
        const portraitPath = `assets/members/${cleanMember.id}-portrait.jpg`;
        await putGithubFile(token, portraitPath, dataUrlBase64(cleanMember.portrait), `Update ${cleanMember.name} portrait`);
        cleanMember.portrait = portraitPath;
      }

      publishedMembers.push(cleanMember);
      setAdminStatus(`正在发布：${cleanMember.name}`);
    }

    const json = JSON.stringify({ members: publishedMembers }, null, 2);
    await putGithubFile(token, "data/members.json", utf8ToBase64(json), "Update Nirvana Harbor members");

    members = publishedMembers;
    saveLocalMembers();
    refreshShowcase(adminIndex);
    setAdminStatus("发布成功。GitHub Pages 通常会在 1 分钟内更新。");
  } catch (error) {
    console.error(error);
    setAdminStatus(`发布失败：${error.message}`);
  } finally {
    adminPublish.disabled = false;
  }
}

function isDataUrl(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function dataUrlBase64(value) {
  return value.split(",")[1] || "";
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

async function putGithubFile(token, path, content, message) {
  const apiPath = `https://api.github.com/repos/${repoConfig.owner}/${repoConfig.repo}/contents/${encodeURIComponentPath(path)}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  let sha;

  const current = await fetch(`${apiPath}?ref=${repoConfig.branch}`, { headers });
  if (current.ok) {
    const data = await current.json();
    sha = data.sha;
  } else if (current.status !== 404) {
    throw new Error(`读取 ${path} 失败：${current.status}`);
  }

  const response = await fetch(apiPath, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content,
      branch: repoConfig.branch,
      sha
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`写入 ${path} 失败：${response.status} ${text.slice(0, 120)}`);
  }
}

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

function playHarborTone() {
  const ctx = ensureAudioContext();
  if (!ctx) {
    return;
  }

  ctx.resume().then(() => {
    musicUnlocked = true;
  }).catch(() => {
    musicUnlocked = false;
  });
  stopHarborTone(false);
  musicOn = true;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.1);
  master.connect(ctx.destination);

  const delay = ctx.createDelay(5);
  delay.delayTime.value = 0.31;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.24;
  const wet = ctx.createGain();
  wet.gain.value = 0.2;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let index = 0; index < noiseData.length; index += 1) {
    noiseData[index] = (Math.random() * 2 - 1) * 0.36;
  }

  const wind = ctx.createBufferSource();
  const windFilter = ctx.createBiquadFilter();
  const windGain = ctx.createGain();
  wind.buffer = noiseBuffer;
  wind.loop = true;
  windFilter.type = "bandpass";
  windFilter.frequency.value = 760;
  windFilter.Q.value = 0.7;
  windGain.gain.value = 0.01;
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  wind.start();
  musicNodes.push(master, delay, feedback, wet, wind, windFilter, windGain);

  const beat = 0.48;
  const bar = beat * 4;
  const scale = [146.83, 164.81, 185, 220, 246.94, 293.66, 329.63, 369.99, 440, 493.88];
  const pluckPattern = [0, 3, 5, 6, 8, 6, 5, 3, 1, 3, 5, 8, 9, 8, 6, 5];
  const flutePattern = [5, 6, 8, 7, 6, 5, 3, 5, 6, 8, 9, 8, 6, 5, 3, 1];
  let pluckStep = 0;
  let fluteStep = 0;
  let drumStep = 0;

  const sendToEcho = (gainNode, amount = 0.2) => {
    const send = ctx.createGain();
    send.gain.value = amount;
    gainNode.connect(send);
    send.connect(delay);
    musicNodes.push(send);
  };

  const playPluck = (frequency, when = ctx.currentTime, accent = false) => {
    if (!musicOn || !audioContext) {
      return;
    }

    const body = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    const overtoneGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();

    body.type = "triangle";
    body.frequency.setValueAtTime(frequency, when);
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(frequency * 2.02, when);
    bodyGain.gain.value = accent ? 0.2 : 0.13;
    overtoneGain.gain.value = accent ? 0.06 : 0.036;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, when);
    filter.frequency.exponentialRampToValueAtTime(760, when + 0.95);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(accent ? 0.16 : 0.1, when + 0.018);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + 1.12);

    body.connect(bodyGain);
    overtone.connect(overtoneGain);
    bodyGain.connect(filter);
    overtoneGain.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    sendToEcho(amp, accent ? 0.18 : 0.1);

    body.start(when);
    overtone.start(when);
    body.stop(when + 1.24);
    overtone.stop(when + 1.24);
    musicNodes.push(body, overtone, bodyGain, overtoneGain, filter, amp);
  };

  const playFlute = (frequency, when = ctx.currentTime) => {
    if (!musicOn || !audioContext) {
      return;
    }

    const osc = ctx.createOscillator();
    const breath = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, when);
    breath.type = "triangle";
    breath.frequency.setValueAtTime(frequency * 2, when);
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(6.4, when);
    lfoGain.gain.setValueAtTime(12, when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, when);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.linearRampToValueAtTime(0.058, when + 0.08);
    amp.gain.setValueAtTime(0.048, when + 0.64);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + 1.22);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    osc.connect(filter);
    breath.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    sendToEcho(amp, 0.22);

    osc.start(when);
    breath.start(when);
    lfo.start(when);
    osc.stop(when + 1.28);
    breath.stop(when + 1.28);
    lfo.stop(when + 1.28);
    musicNodes.push(osc, breath, lfo, lfoGain, filter, amp);
  };

  const playBassString = (frequency, when = ctx.currentTime, sustain = 1.8) => {
    if (!musicOn || !audioContext) {
      return;
    }

    const body = ctx.createOscillator();
    const growl = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    body.type = "triangle";
    growl.type = "sine";
    body.frequency.setValueAtTime(frequency, when);
    growl.frequency.setValueAtTime(frequency * 0.5, when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, when);
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(0.095, when + 0.035);
    amp.gain.setValueAtTime(0.068, when + Math.max(0.08, sustain - 0.34));
    amp.gain.exponentialRampToValueAtTime(0.0001, when + sustain);
    body.connect(filter);
    growl.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    body.start(when);
    growl.start(when);
    body.stop(when + sustain + 0.04);
    growl.stop(when + sustain + 0.04);
    musicNodes.push(body, growl, filter, amp);
  };

  const playDrum = (when = ctx.currentTime, accent = false) => {
    if (!musicOn || !audioContext) {
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(accent ? 96 : 82, when);
    osc.frequency.exponentialRampToValueAtTime(accent ? 42 : 50, when + 0.32);
    filter.type = "lowpass";
    filter.frequency.value = 210;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.34 : 0.22, when + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.46);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + 0.5);
    musicNodes.push(osc, gain, filter);
  };

  const playHandDrum = (when = ctx.currentTime, accent = false) => {
    if (!musicOn || !audioContext) {
      return;
    }

    const hit = ctx.createBufferSource();
    const body = ctx.createOscillator();
    const hitFilter = ctx.createBiquadFilter();
    const hitGain = ctx.createGain();
    const bodyGain = ctx.createGain();
    hit.buffer = noiseBuffer;
    hitFilter.type = "bandpass";
    hitFilter.frequency.value = accent ? 760 : 980;
    hitFilter.Q.value = 3.6;
    hitGain.gain.setValueAtTime(0.0001, when);
    hitGain.gain.exponentialRampToValueAtTime(accent ? 0.16 : 0.1, when + 0.01);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
    body.type = "triangle";
    body.frequency.setValueAtTime(accent ? 185 : 230, when);
    body.frequency.exponentialRampToValueAtTime(120, when + 0.18);
    bodyGain.gain.setValueAtTime(0.0001, when);
    bodyGain.gain.exponentialRampToValueAtTime(accent ? 0.12 : 0.07, when + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
    hit.connect(hitFilter);
    hitFilter.connect(hitGain);
    hitGain.connect(master);
    body.connect(bodyGain);
    bodyGain.connect(master);
    hit.start(when);
    body.start(when);
    hit.stop(when + 0.22);
    body.stop(when + 0.24);
    musicNodes.push(hit, body, hitFilter, hitGain, bodyGain);
  };

  const playWoodblock = (when = ctx.currentTime) => {
    if (!musicOn || !audioContext) {
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "square";
    osc.frequency.setValueAtTime(720, when);
    osc.frequency.exponentialRampToValueAtTime(430, when + 0.08);
    filter.type = "highpass";
    filter.frequency.value = 360;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.048, when + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.13);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(when);
    osc.stop(when + 0.14);
    musicNodes.push(osc, gain, filter);
  };

  const playCrash = (when = ctx.currentTime) => {
    if (!musicOn || !audioContext) {
      return;
    }

    const crash = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    crash.buffer = noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 1600;
    amp.gain.setValueAtTime(0.0001, when);
    amp.gain.exponentialRampToValueAtTime(0.07, when + 0.018);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
    crash.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    sendToEcho(amp, 0.18);
    crash.start(when);
    crash.stop(when + 1.7);
    musicNodes.push(crash, filter, amp);
  };

  const scheduleBar = () => {
    const now = ctx.currentTime + 0.04;
    const root = scale[drumStep % 4 === 1 ? 1 : 0];
    playBassString(root, now, bar * 0.94);
    if (drumStep % 4 === 0) {
      playCrash(now);
    }

    for (let index = 0; index < 4; index += 1) {
      const beatTime = now + index * beat;
      playDrum(beatTime, index === 0);
      playWoodblock(beatTime + beat * 0.5);
      if (index === 1 || index === 3) {
        playHandDrum(beatTime, true);
      }
      if (index === 2 && drumStep % 2 === 0) {
        playDrum(beatTime + beat * 0.5, false);
      }
    }

    for (let index = 0; index < 12; index += 1) {
      const note = scale[pluckPattern[pluckStep % pluckPattern.length]];
      const accent = index % 3 === 0;
      playPluck(note * (index === 0 || index === 8 ? 0.5 : 1), now + index * beat / 3, accent);
      pluckStep += 1;
    }

    [0, 0.75, 1.5, 2.5].forEach((offset, index) => {
      const note = scale[flutePattern[(fluteStep + index) % flutePattern.length]];
      playFlute(note * (offset === 2.5 && drumStep % 2 === 0 ? 4 : 2), now + offset * beat);
    });
    fluteStep += drumStep % 2 === 0 ? 5 : 3;

    drumStep += 1;
  };

  scheduleBar();
  musicTimers.push(window.setInterval(scheduleBar, bar * 1000));
}

function stopHarborTone(markStopped = true) {
  musicTimers.forEach((musicTimer) => window.clearInterval(musicTimer));
  musicTimers = [];

  musicNodes.forEach((node) => {
    try {
      if (typeof node.stop === "function") {
        node.stop();
      }
      if (typeof node.disconnect === "function") {
        node.disconnect();
      }
    } catch (error) {
      // Audio nodes may already be stopped; ignore cleanup races.
    }
  });
  musicNodes = [];

  if (markStopped) {
    musicOn = false;
  }
}

function getBgmPlaylist() {
  if (!siteBgm) {
    return [];
  }

  const rawPlaylist = siteBgm.dataset.playlist || siteBgm.dataset.src || "";
  return rawPlaylist
    .split(",")
    .map((source) => source.trim())
    .filter(Boolean);
}

function updateMusicToggle() {
  if (!musicToggle || !siteBgm) {
    return;
  }

  const isPlaying = !siteBgm.paused && !siteBgm.ended;
  musicToggle.classList.toggle("is-playing", isPlaying);
  musicToggle.textContent = isPlaying ? "Ⅱ" : "♪";
  musicToggle.setAttribute("aria-label", isPlaying ? "暂停背景音乐" : "播放背景音乐");
  musicToggle.title = isPlaying ? "暂停背景音乐" : "播放背景音乐";
}

function setBgmTrack(index) {
  const playlist = getBgmPlaylist();
  if (!siteBgm || !playlist.length) {
    bgmFileFailed = true;
    updateMusicToggle();
    return false;
  }

  const nextIndex = (index + playlist.length) % playlist.length;
  const source = playlist[nextIndex];
  bgmTrackIndex = nextIndex;
  bgmFileFailed = false;
  if (!siteBgm.currentSrc.endsWith(source)) {
    siteBgm.src = source;
    siteBgm.load();
  }
  siteBgm.dataset.currentTrack = source;
  updateMusicToggle();
  return true;
}

function primeBgmTrack() {
  if (!siteBgm || siteBgm.currentSrc) {
    return;
  }
  setBgmTrack(bgmTrackIndex);
}

async function canUseBgmSource(source) {
  if (bgmFailedSources.has(source)) {
    return false;
  }
  if (bgmCheckedSources.has(source)) {
    return true;
  }

  try {
    const response = await fetch(source, { method: "HEAD", cache: "no-store" });
    if (!response.ok) {
      bgmFailedSources.add(source);
      return false;
    }
    bgmCheckedSources.add(source);
    return true;
  } catch (error) {
    bgmFailedSources.add(source);
    return false;
  }
}

async function prepareBgmTrack(startIndex = bgmTrackIndex) {
  const playlist = getBgmPlaylist();
  if (!siteBgm || !playlist.length) {
    bgmFileFailed = true;
    return false;
  }

  for (let offset = 0; offset < playlist.length; offset += 1) {
    const index = (startIndex + offset + playlist.length) % playlist.length;
    const source = playlist[index];
    if (await canUseBgmSource(source)) {
      return setBgmTrack(index);
    }
  }

  bgmFileFailed = true;
  return false;
}

async function playBgmFile(startIndex = bgmTrackIndex, options = {}) {
  if (!siteBgm) {
    return false;
  }

  const playlist = getBgmPlaylist();
  const ready = options.immediate ? setBgmTrack(startIndex) : await prepareBgmTrack(startIndex);
  if (!ready) {
    return false;
  }

  siteBgm.volume = 0.62;
  siteBgm.loop = false;

  try {
    await siteBgm.play();
    musicUnlocked = true;
    musicOn = true;
    updateMusicToggle();
    return true;
  } catch (error) {
    if (error.name !== "NotAllowedError") {
      bgmFailedSources.add(siteBgm.dataset.currentTrack || "");
      if (bgmFailedSources.size < playlist.length) {
        return playBgmFile(bgmTrackIndex + 1, options);
      }
      bgmFileFailed = true;
      updateMusicToggle();
      return false;
    }
    musicUnlocked = false;
    updateMusicToggle();
    return false;
  }
}

async function startBgmFromUserGesture() {
  musicUserPaused = false;
  bgmFileFailed = false;
  const played = await playBgmFile(bgmTrackIndex, { immediate: true });
  if (!played && bgmFileFailed) {
    startProceduralBgm();
  }
  updateMusicToggle();
  return played;
}

function pauseBgmFile() {
  if (siteBgm) {
    siteBgm.pause();
  }
  musicOn = false;
  updateMusicToggle();
}

function toggleBgm() {
  if (!siteBgm) {
    startProceduralBgm();
    return;
  }

  if (!siteBgm.paused && !siteBgm.ended) {
    musicUserPaused = true;
    pauseBgmFile();
    return;
  }

  startBgmFromUserGesture();
}

function handleMusicToggle(event) {
  event?.stopPropagation();
  const now = Date.now();
  if (now - lastMusicToggleAt < 420) {
    return;
  }
  lastMusicToggleAt = now;
  toggleBgm();
}

function playNextBgmTrack() {
  const playlist = getBgmPlaylist();
  if (!playlist.length) {
    startProceduralBgm();
    return;
  }

  playBgmFile((bgmTrackIndex + 1) % playlist.length).then((played) => {
    if (!played && bgmFileFailed) {
      startProceduralBgm();
    }
  });
}

function startProceduralBgm() {
  if (!musicOn || bgmFileFailed) {
    playHarborTone();
  }
  updateMusicToggle();
}

function startAutoplayBgm() {
  if (siteBgm) {
    primeBgmTrack();
    siteBgm.addEventListener("error", () => {
      bgmFailedSources.add(siteBgm.dataset.currentTrack || siteBgm.currentSrc);
      playNextBgmTrack();
    });
    siteBgm.addEventListener("ended", playNextBgmTrack);
    siteBgm.addEventListener("play", updateMusicToggle);
    siteBgm.addEventListener("pause", updateMusicToggle);
    siteBgm.addEventListener("loadedmetadata", updateMusicToggle);
  }

  playBgmFile().then((played) => {
    if (!played && bgmFileFailed) {
      startProceduralBgm();
    }
  });

  const unlock = async () => {
    if (musicUserPaused) {
      return;
    }

    if (siteBgm) {
      const played = await startBgmFromUserGesture();
      if (played) {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("touchstart", unlock);
        window.removeEventListener("click", unlock);
        window.removeEventListener("keydown", unlock);
        return;
      }
    }

    if (!musicOn || bgmFileFailed) {
      startProceduralBgm();
    }

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().then(() => {
        musicUnlocked = true;
      }).catch(() => {
        musicUnlocked = false;
      });
    }

    if (musicUnlocked || (audioContext && audioContext.state === "running")) {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    }
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !musicUserPaused && siteBgm && !bgmFileFailed && siteBgm.paused) {
      playBgmFile().catch(() => {});
    }
    if (!document.hidden && audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  });
  updateMusicToggle();
}

window.addEventListener("beforeunload", () => {
  if (siteBgm) {
    siteBgm.pause();
  }
  if (musicOn) {
    stopHarborTone();
  }
});

window.addEventListener("load", () => {
  if (!musicOn) {
    startAutoplayBgm();
  }
});

selfOpen?.addEventListener("click", openSelfPanel);
selfClose?.addEventListener("click", closeSelfPanel);
selfPanel?.addEventListener("click", (event) => {
  if (event.target === selfPanel) {
    closeSelfPanel();
  }
});
selfLogin?.addEventListener("click", signInSelf);
selfSignup?.addEventListener("click", signUpSelf);
selfLogout?.addEventListener("click", signOutSelf);
selfForm?.addEventListener("submit", saveSelfProfile);
musicToggle?.addEventListener("pointerdown", (event) => event.stopPropagation());
musicToggle?.addEventListener("touchstart", (event) => event.stopPropagation(), { passive: true });
musicToggle?.addEventListener("pointerup", handleMusicToggle);
musicToggle?.addEventListener("touchend", handleMusicToggle, { passive: true });
musicToggle?.addEventListener("click", handleMusicToggle);
adminOpen?.addEventListener("click", openAdmin);
directoryOpen.addEventListener("click", openDirectory);
directoryClose.addEventListener("click", closeDirectory);
alumniOpen.addEventListener("click", () => {
  alumniPanel.classList.add("is-open");
  alumniPanel.setAttribute("aria-hidden", "false");
  renderAlumni();
});
alumniClose.addEventListener("click", () => {
  alumniPanel.classList.remove("is-open");
  alumniPanel.setAttribute("aria-hidden", "true");
});
alumniPanel.addEventListener("click", (event) => {
  if (event.target === alumniPanel) {
    alumniPanel.classList.remove("is-open");
    alumniPanel.setAttribute("aria-hidden", "true");
  }
});
directoryPanel.addEventListener("click", (event) => {
  if (event.target === directoryPanel) {
    closeDirectory();
  }
});
directorySearch.addEventListener("input", () => {
  directoryQuery = directorySearch.value;
  renderDirectory();
});
adminClose?.addEventListener("click", closeAdmin);
adminPanel?.addEventListener("click", (event) => {
  if (event.target === adminPanel) {
    closeAdmin();
  }
});
adminAdd?.addEventListener("click", () => {
  members.push(createBlankMember());
  adminIndex = members.length - 1;
  saveLocalMembers();
  refreshShowcase(adminIndex);
  fillAdminForm();
});
adminForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const existing = members[adminIndex] || createBlankMember();
  const updated = memberFromForm(existing);

  if (adminAvatar.files[0]) {
    updated.avatar = await fileToDataUrl(adminAvatar.files[0], 520, 0.84);
  }
  if (adminPortrait.files[0]) {
    updated.portrait = await fileToDataUrl(adminPortrait.files[0], 2200, 0.86);
  }

  members[adminIndex] = updated;
  saveLocalMembers();
  refreshShowcase(adminIndex);
  fillAdminForm();
  setAdminStatus("已保存到当前浏览器预览。");
});
adminDelete?.addEventListener("click", () => {
  if (members.length <= 1) {
    setAdminStatus("至少保留一名成员。");
    return;
  }
  members.splice(adminIndex, 1);
  adminIndex = Math.max(0, adminIndex - 1);
  saveLocalMembers();
  refreshShowcase(adminIndex);
  fillAdminForm();
  setAdminStatus("已删除成员。");
});
adminExport?.addEventListener("click", downloadMembersJson);
adminPublish?.addEventListener("click", publishToGithub);

stage.addEventListener("mouseenter", pauseCycle);
stage.addEventListener("mouseleave", resumeCycle);

loadMembers().then((loadedMembers) => {
  members = loadedMembers;
  renderRoster();
  renderAdminList();
  setActive(0);
  startCycle();
  refreshSelfAuth();
});
