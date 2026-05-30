# 涅槃港成员投稿审核流程

1. 打开投稿列表：
   https://github.com/nirvana-harbor/trixy1900/issues

2. 点开一条带 `member-submission` 标签的投稿。

3. 检查游戏 ID、状态、职位、标签、短句、头像图和角色展示图。

4. 如果通过审核，给这条 Issue 添加 `approved` 标签。

5. GitHub Actions 会自动：
   - 读取这条 Issue 表单
   - 写入 `data/members.json`
   - 提交并推送更新
   - 评论“已导入”
   - 关闭这条 Issue

6. GitHub Pages 通常会在 1 分钟左右更新。

如果投稿需要修改，不要加 `approved` 标签，直接在 Issue 里回复成员需要补充的内容。
