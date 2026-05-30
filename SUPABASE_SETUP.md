# 涅槃港云端成员自助上传配置

这套配置把网页从“静态展示页”升级成“可登录、可上传、可审核”的成员名册。

## 1. 创建 Supabase 项目

1. 打开 https://supabase.com/ 并创建一个新项目。
2. 进入项目后打开 `SQL Editor`。
3. 复制 `supabase/schema.sql` 的全部内容并执行。
4. 进入 `Project Settings -> API`，复制：
   - `Project URL`
   - `anon public` key
5. 打开 `config.js`，填入：

```js
window.NIRVANA_SUPABASE = {
  url: "你的 Project URL",
  anonKey: "你的 anon public key",
  membersTable: "members",
  storageBucket: "member-portraits"
};
```

`anon public key` 可以放在前端；不要把 `service_role` key 放进网页或 GitHub。

## 2. 设置你为审核管理员

先在网页“成员自助”里用你的邮箱注册一次。然后在 Supabase 的 `Authentication -> Users` 找到你的 `User UID`，到 `SQL Editor` 执行：

```sql
insert into public.member_admins (user_id)
values ('你的 User UID')
on conflict do nothing;
```

以后你可以在 Supabase 表格里把成员的 `status` 从 `pending` 改成：

- `active`：现役成员，会显示在主轮播和全员名册。
- `alumni`：旧友成员，会显示在旧友录。

## 3. Auth 设置

进入 `Authentication -> URL Configuration`：

- `Site URL` 填你的正式网址，例如 `https://trixy1900.cn`。
- `Redirect URLs` 加上 `https://trixy1900.cn/**` 和 `https://nirvana-harbor.github.io/trixy1900/**`。

进入 `Authentication -> Providers -> Email`：

- 确认 `Email provider` 和 `Sign ups` 是开启状态。
- 如果没有配置 SMTP，测试阶段可以先关闭 `Confirm email`，否则注册时可能因为确认邮件发送失败而报错。

## 4. 成员如何使用

成员打开网站，点“成员自助”，用邮箱注册或登录，填写游戏 ID、标签、短句并上传头像/角色展示图。首次保存后状态是 `pending`，你审核通过后才公开展示。

## 5. 域名 DNS

当前项目已添加 `CNAME` 文件，内容是：

```text
trixy1900.cn
```

还需要你在购买域名的平台添加 DNS：

| 类型 | 主机记录 | 值 |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | nirvana-harbor.github.io |

DNS 生效后，在 GitHub 仓库 `Settings -> Pages -> Custom domain` 填 `trixy1900.cn`，勾选 `Enforce HTTPS`。
