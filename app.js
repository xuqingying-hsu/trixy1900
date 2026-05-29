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
const musicToggle = document.querySelector("#musicToggle");
let audioContext = null;
let musicNodes = [];
let musicTimer = null;
let musicOn = false;

async function loadMembers() {
  try {
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
    musicToggle.textContent = "无声";
    return;
  }

  ctx.resume();
  stopHarborTone(false);
  musicOn = true;
  musicToggle.classList.add("is-playing");
  musicToggle.setAttribute("aria-pressed", "true");

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
    musicToggle.classList.remove("is-playing");
    musicToggle.setAttribute("aria-pressed", "false");
  }
}

musicToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  if (musicOn) {
    stopHarborTone();
  } else {
    playHarborTone();
  }
});

stage.addEventListener("mouseenter", pauseCycle);
stage.addEventListener("mouseleave", resumeCycle);

loadMembers().then((loadedMembers) => {
  members = loadedMembers;
  renderRoster();
  setActive(0);
  startCycle();
});
