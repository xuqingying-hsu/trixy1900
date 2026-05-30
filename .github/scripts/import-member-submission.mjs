import fs from "node:fs/promises";
import path from "node:path";

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const eventName = process.env.GITHUB_EVENT_NAME;
const eventPath = process.env.GITHUB_EVENT_PATH;
const issueNumberInput = process.env.ISSUE_NUMBER;
const membersPath = path.join("data", "members.json");

if (!repo || !token) {
  throw new Error("Missing GITHUB_REPOSITORY or GITHUB_TOKEN.");
}

const event = JSON.parse(await fs.readFile(eventPath, "utf8"));
const issue = eventName === "workflow_dispatch"
  ? await fetchIssue(issueNumberInput)
  : event.issue;

if (!issue) {
  throw new Error("No issue found to import.");
}

const labels = (issue.labels || []).map((label) => typeof label === "string" ? label : label.name);
if (!labels.includes("member-submission")) {
  throw new Error(`Issue #${issue.number} is not a member submission.`);
}

const fields = parseIssueForm(issue.body || "");
const gameId = valueFor(fields, "游戏 ID", "游戏ID", "game_id");
const role = valueFor(fields, "职位或身份", "职位", "身份", "role") || "港内成员";
const memberStatus = valueFor(fields, "名册状态", "状态", "member_status");
const tagsText = valueFor(fields, "标签", "tags");
const quote = valueFor(fields, "角色短句", "短句", "quote");
const avatarText = valueFor(fields, "头像图", "头像", "avatar");
const portraitText = valueFor(fields, "角色展示图", "角色图", "portrait");

if (!gameId) {
  throw new Error("投稿缺少游戏 ID。");
}
if (!portraitText) {
  throw new Error("投稿缺少角色展示图。");
}

const avatar = extractAssetUrl(avatarText);
const portrait = extractAssetUrl(portraitText);
if (!portrait) {
  throw new Error("角色展示图里没有找到图片链接。请确认成员把图片上传到了 Issue。");
}

const status = memberStatus.includes("旧友") ? "alumni" : "active";
const tags = tagsText
  .split(/[，,]/)
  .map((tag) => tag.trim())
  .filter(Boolean);

const membersData = JSON.parse(await fs.readFile(membersPath, "utf8"));
const members = Array.isArray(membersData.members) ? membersData.members : [];
const existingIndex = members.findIndex((member) => member.name === gameId || member.id === slugify(gameId));
const previous = existingIndex >= 0 ? members[existingIndex] : {};
const member = {
  id: previous.id || uniqueId(slugify(gameId), members),
  name: gameId,
  role,
  avatar: avatar || previous.avatar || "assets/member-placeholder.png",
  portrait,
  status,
  tags: tags.length ? tags : [status === "alumni" ? "旧友" : "涅槃港"],
  quote: quote || previous.quote || "长风入港，同赴涅槃。"
};

if (existingIndex >= 0) {
  members[existingIndex] = member;
} else {
  members.push(member);
}

await fs.writeFile(membersPath, `${JSON.stringify({ members }, null, 2)}\n`, "utf8");

await execGit(["config", "user.name", "github-actions[bot]"]);
await execGit(["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
await execGit(["add", membersPath]);

const changed = await execGit(["status", "--porcelain"]);
if (!changed.trim()) {
  await comment(issue.number, `投稿已审核，但名册没有变化：${gameId}`);
  await closeIssue(issue.number);
  process.exit(0);
}

await execGit(["commit", "-m", `Import member submission: ${gameId}`]);
await execGit(["push"]);
await comment(issue.number, `已导入 ${gameId} 到涅槃港名册，并触发 GitHub Pages 更新。`);
await closeIssue(issue.number);

function parseIssueForm(body) {
  const fields = new Map();
  const headingRegex = /^###\s+(.+?)\s*$/gm;
  const headings = [...body.matchAll(headingRegex)];
  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const key = heading[1].trim();
    const start = heading.index + heading[0].length;
    const end = index + 1 < headings.length ? headings[index + 1].index : body.length;
    const value = body.slice(start, end).trim();
    fields.set(key, value === "_No response_" ? "" : value);
  }
  return fields;
}

function valueFor(fields, ...names) {
  for (const name of names) {
    if (fields.has(name)) {
      return fields.get(name).trim();
    }
  }
  return "";
}

function extractAssetUrl(text) {
  const markdownImage = text.match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/);
  if (markdownImage) {
    return markdownImage[1];
  }
  const markdownLink = text.match(/\[[^\]]+]\((https?:\/\/[^)\s]+)\)/);
  if (markdownLink) {
    return markdownLink[1];
  }
  const plainUrl = text.match(/https?:\/\/\S+/);
  return plainUrl ? plainUrl[0].replace(/[)>.,，。]+$/, "") : "";
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || `member-${Date.now().toString(36)}`;
}

function uniqueId(base, members) {
  let candidate = base;
  let suffix = 2;
  const ids = new Set(members.map((member) => member.id));
  while (ids.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function fetchIssue(number) {
  if (!number) {
    throw new Error("workflow_dispatch requires issue_number.");
  }
  const response = await api(`https://api.github.com/repos/${repo}/issues/${number}`);
  return response;
}

async function comment(number, body) {
  await api(`https://api.github.com/repos/${repo}/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body })
  });
}

async function closeIssue(number) {
  await api(`https://api.github.com/repos/${repo}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" })
  });
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function execGit(args) {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data;
    });
    child.stderr.on("data", (data) => {
      stderr += data;
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`git ${args.join(" ")} failed:\n${stderr || stdout}`));
      }
    });
  });
}
