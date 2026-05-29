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
    name: "晟杨",
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
const adminOpen = document.querySelector("#adminOpen");
const adminPanel = document.querySelector("#adminPanel");
const adminClose = document.querySelector("#adminClose");
const adminAdd = document.querySelector("#adminAdd");
const adminForm = document.querySelector("#adminForm");
const adminMemberList = document.querySelector("#adminMemberList");
const adminName = document.querySelector("#adminName");
const adminRole = document.querySelector("#adminRole");
const adminTags = document.querySelector("#adminTags");
const adminQuote = document.querySelector("#adminQuote");
const adminAvatar = document.querySelector("#adminAvatar");
const adminPortrait = document.querySelector("#adminPortrait");
const adminDelete = document.querySelector("#adminDelete");
const adminExport = document.querySelector("#adminExport");
const adminPublish = document.querySelector("#adminPublish");
const adminStatus = document.querySelector("#adminStatus");
const githubToken = document.querySelector("#githubToken");
let audioContext = null;
let musicNodes = [];
let musicTimer = null;
let musicOn = false;
let musicUnlocked = false;
let adminIndex = 0;

const localMembersKey = "nirvana-harbor-members";
const repoConfig = {
  owner: "xuqingying-hsu",
  repo: "trixy1900",
  branch: "main"
};

async function loadMembers() {
  try {
    const localMembers = readLocalMembers();
    if (localMembers) {
      return localMembers;
    }

    const response = await fetch("data/members.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`members.json returned ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.members) && data.members.length ? data.members : fallbackMembers;
  } catch (error) {
    console.warn("Using built-in member data:", error);
    return fallbackMembers;
  }
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

function renderRoster() {
  rosterEl.innerHTML = "";
  rosterCountEl.textContent = String(members.length).padStart(2, "0");
  memberTotalEl.textContent = `/ ${String(members.length).padStart(2, "0")}`;

  members.forEach((member, index) => {
    const card = document.createElement("button");
    card.className = "member-card";
    card.type = "button";
    card.dataset.index = index;
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
}

function refreshShowcase(index = activeIndex) {
  renderRoster();
  renderAdminList();
  setActive(Math.min(index, members.length - 1));
}

function setActive(index, userInitiated = false) {
  if (!members.length) {
    return;
  }

  activeIndex = (index + members.length) % members.length;
  const member = members[activeIndex];
  const memberImage = imageFor(member);

  portrait.classList.add("is-switching");
  window.setTimeout(() => {
    document.documentElement.style.setProperty("--active-portrait", `url("${memberImage.replaceAll('"', '\\"')}")`);
    nameEl.textContent = member.name;
    roleEl.textContent = member.role;
    quoteEl.textContent = member.quote || "长风入港，同赴涅槃。";
    memberIndexEl.textContent = String(activeIndex + 1).padStart(2, "0");

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
      card.classList.toggle("is-active", cardIndex === activeIndex);
      card.setAttribute("aria-current", cardIndex === activeIndex ? "true" : "false");
    });

    window.setTimeout(() => portrait.classList.remove("is-switching"), 60);
    restartProgress();
  }, 220);

  if (userInitiated) {
    restartCycle();
  }
}

function startCycle() {
  stopCycle();
  if (paused || members.length < 2) {
    return;
  }
  timer = window.setInterval(() => {
    setActive(activeIndex + 1);
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
  if (!paused && members.length > 1) {
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
  adminTags.value = (member.tags || []).join("，");
  adminQuote.value = member.quote || "";
  adminAvatar.value = "";
  adminPortrait.value = "";
}

function createBlankMember() {
  return {
    id: `member-${Date.now().toString(36)}`,
    name: "新成员",
    role: "港内成员",
    avatar: placeholderImage,
    portrait: "",
    tags: ["涅槃港"],
    quote: "长风入港，同赴涅槃。"
  };
}

function memberFromForm(existing) {
  return {
    ...existing,
    id: existing.id || slugify(adminName.value || "member"),
    name: adminName.value.trim(),
    role: adminRole.value.trim(),
    tags: adminTags.value
      .split(/[，,]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    quote: adminQuote.value.trim()
  };
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
  master.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 1.2);
  master.connect(ctx.destination);

  const delay = ctx.createDelay(5);
  delay.delayTime.value = 0.42;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);

  const notes = [196, 220, 247, 294, 330, 392, 440];
  let step = 0;
  const playNote = () => {
    if (!musicOn || !audioContext) {
      return;
    }

    const now = ctx.currentTime;
    const base = notes[step % notes.length];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = step % 3 === 0 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(base * (step % 5 === 0 ? 0.5 : 1), now);
    osc.detune.setValueAtTime((step % 4 - 1.5) * 4, now);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(960, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(step % 4 === 0 ? 0.13 : 0.08, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    gain.connect(delay);
    osc.start(now);
    osc.stop(now + 2.5);

    musicNodes.push(osc, gain, filter);
    step += step % 2 === 0 ? 2 : 1;
  };

  playNote();
  musicTimer = window.setInterval(playNote, 1180);
  musicNodes.push(master, delay, feedback, wet);
}

function stopHarborTone(markStopped = true) {
  if (musicTimer) {
    window.clearInterval(musicTimer);
    musicTimer = null;
  }

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

function startAutoplayBgm() {
  playHarborTone();

  const unlock = () => {
    if (!musicOn) {
      playHarborTone();
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
      window.removeEventListener("keydown", unlock);
    }
  };

  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  });
}

window.addEventListener("beforeunload", () => {
  if (musicOn) {
    stopHarborTone();
  }
});

window.addEventListener("load", () => {
  if (!musicOn) {
    startAutoplayBgm();
  }
});

adminOpen.addEventListener("click", openAdmin);
adminClose.addEventListener("click", closeAdmin);
adminPanel.addEventListener("click", (event) => {
  if (event.target === adminPanel) {
    closeAdmin();
  }
});
adminAdd.addEventListener("click", () => {
  members.push(createBlankMember());
  adminIndex = members.length - 1;
  saveLocalMembers();
  refreshShowcase(adminIndex);
  fillAdminForm();
});
adminForm.addEventListener("submit", async (event) => {
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
adminDelete.addEventListener("click", () => {
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
adminExport.addEventListener("click", downloadMembersJson);
adminPublish.addEventListener("click", publishToGithub);

stage.addEventListener("mouseenter", pauseCycle);
stage.addEventListener("mouseleave", resumeCycle);

loadMembers().then((loadedMembers) => {
  members = loadedMembers;
  renderRoster();
  renderAdminList();
  setActive(0);
  startCycle();
});
