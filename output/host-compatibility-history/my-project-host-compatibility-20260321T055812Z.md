# Host Compatibility Report

- Generated At (UTC): 2026-03-21T05:58:12.363252+00:00
- Project Dir: C:\Users\Administrator\univer\-bom
- Detected Hosts: codebuddy, cursor-cli, kiro-cli, qoder-cli, cursor, kiro, qoder
- Selected Targets: codebuddy, cursor-cli, kiro-cli, qoder-cli, cursor, kiro, qoder

## Summary
- Overall Score: 28.57/100
- Ready Hosts: 0/7
- Enabled Checks: integrate, skill, slash

## Per-Host Scores

| Host | Certification | Score | Ready | Passed/Total |
|---|---|---:|---|---:|
| codebuddy | Experimental | 0.0 | no | 0/3 |
| cursor-cli | Compatible | 66.67 | no | 2/3 |
| kiro-cli | Compatible | 33.33 | no | 1/3 |
| qoder-cli | Compatible | 0.0 | no | 0/3 |
| cursor | Experimental | 66.67 | no | 2/3 |
| kiro | Experimental | 33.33 | no | 1/3 |
| qoder | Experimental | 0.0 | no | 0/3 |

## Usage Guidance

### codebuddy
- Certification: Experimental (experimental)
- Certification Reason: IDE 侧 commands + agents + skills 接入完整，但对 Agent Chat slash 的项目级行为仍缺少持续真机验证。
- Certification Evidence:
  - 官方文档公开 IDE integrations
  - 官方文档公开 Subagents 与 Skills
  - Super Dev 已写入 rules、commands、agents 与 skills 接入面
- Primary Entry: /super-dev "<需求描述>"（在 IDE Agent Chat 内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: IDE Agent Chat
- Restart Required: 否
- Post Onboard Steps:
  - 在 IDE Agent Chat 中执行 /super-dev。
  - 保持研究、文档、Spec 与编码在同一上下文中连续完成。
- Notes: IDE 宿主优先通过 Agent Chat 触发；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### cursor-cli
- Certification: Compatible (compatible)
- Certification Reason: 官方 CLI slash 文档明确，当前接入链路完整，但仍需更多运行级认证样本。
- Certification Evidence:
  - 官方文档公开 CLI slash commands
  - Super Dev 已提供规则、Skill 与 slash 安装路径
- Primary Entry: /super-dev "<需求描述>"（在该 CLI 宿主会话内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: 当前 CLI 宿主会话
- Restart Required: 否
- Post Onboard Steps:
  - 保持在宿主当前会话中执行 /super-dev。
  - 让宿主先完成同类产品研究，再继续文档与编码阶段。
- Notes: CLI 宿主建议直接在当前会话执行 slash 命令；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### kiro-cli
- Certification: Compatible (compatible)
- Certification Reason: CLI 接入与 Kiro 生态规则一致，但仍需补更完整的长期回归样本。
- Certification Evidence:
  - 官方文档公开 Kiro CLI
  - Super Dev 已提供规则、Skill 与 slash/steering 接入
- Primary Entry: /super-dev "<需求描述>"（在该 CLI 宿主会话内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: 当前 CLI 宿主会话
- Restart Required: 否
- Post Onboard Steps:
  - 保持在宿主当前会话中执行 /super-dev。
  - 让宿主先完成同类产品研究，再继续文档与编码阶段。
- Notes: CLI 宿主建议直接在当前会话执行 slash 命令；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### qoder-cli
- Certification: Compatible (compatible)
- Certification Reason: Qoder CLI 文档明确、接入链路完整，当前定位为稳定兼容而非已认证。
- Certification Evidence:
  - 官方文档公开 Qoder CLI 与 rules
  - Super Dev 已提供规则、Skill 与 slash 安装路径
- Primary Entry: /super-dev "<需求描述>"（在该 CLI 宿主会话内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: 当前 CLI 宿主会话
- Restart Required: 否
- Post Onboard Steps:
  - 保持在宿主当前会话中执行 /super-dev。
  - 让宿主先完成同类产品研究，再继续文档与编码阶段。
- Notes: CLI 宿主建议直接在当前会话执行 slash 命令；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### cursor
- Certification: Experimental (experimental)
- Certification Reason: IDE Agent Chat 能力可映射，但项目级 slash 行为仍需持续运行级验证。
- Certification Evidence:
  - 官方文档公开 Agent commands
  - Super Dev 已写入规则、Skill 与命令映射
- Primary Entry: /super-dev "<需求描述>"（在 IDE Agent Chat 内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: IDE Agent Chat
- Restart Required: 否
- Post Onboard Steps:
  - 在 IDE Agent Chat 中执行 /super-dev。
  - 保持研究、文档、Spec 与编码在同一上下文中连续完成。
- Notes: IDE 宿主优先通过 Agent Chat 触发；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

### kiro
- Certification: Experimental (experimental)
- Certification Reason: IDE steering 模式已对齐，但手动触发与 Agent 行为仍需更多真机验证。
- Certification Evidence:
  - 官方文档公开 steering
  - Super Dev 已写入规则、Skill 与 steering 文件
- Primary Entry: 在 Kiro IDE Agent Chat 输入 `super-dev: <需求描述>`（由 .kiro/steering/super-dev.md + 兼容 Skill〔若检测到〕生效）
- Usage Mode: rules-and-skill
- Trigger Command: super-dev: <需求描述>
- Trigger Context: Kiro IDE Agent Chat
- Restart Required: 是
- Post Onboard Steps:
  - 完成接入后重新打开 Kiro，或至少新开一个 Agent Chat，使 steering、rules 与兼容 Skill（若已安装）一起生效。
  - 确保当前项目就是已接入 Super Dev 的工作区。
  - 输入 `super-dev: <需求描述>` 触发完整流程。
  - 按 output/* 与 .super-dev/changes/*/tasks.md 执行开发。
- Notes: 该宿主当前走 steering/rules + compatibility skill 模式：项目级 .kiro/steering/super-dev.md 是核心约束；若检测到 ~/.kiro/skills，则会增强安装 super-dev-core。

### qoder
- Certification: Experimental (experimental)
- Certification Reason: 官方文档明确支持项目级 commands，当前已按 Agent Chat slash + project rules 建模，但仍需要更多真机样本。
- Certification Evidence:
  - 官方文档公开 Commands 且支持项目级 .qoder/commands/
  - Super Dev 已同时写入 .qoder/rules.md 与 .qoder/commands/super-dev.md
- Primary Entry: /super-dev "<需求描述>"（在 IDE Agent Chat 内）
- Usage Mode: native-slash
- Trigger Command: /super-dev "<需求描述>"
- Trigger Context: IDE Agent Chat
- Restart Required: 否
- Post Onboard Steps:
  - 在 IDE Agent Chat 中执行 /super-dev。
  - 保持研究、文档、Spec 与编码在同一上下文中连续完成。
- Notes: IDE 宿主优先通过 Agent Chat 触发；slash 负责触发，host skill 负责让宿主理解 Super Dev 流水线协议。

## Missing Items

### codebuddy
- Missing: integrate, skill, slash
- Suggestion: `super-dev integrate setup --target codebuddy --force`
- Suggestion: `super-dev skill install super-dev --target codebuddy --name super-dev-core --force`
- Suggestion: `super-dev onboard --host codebuddy --skip-integrate --skip-skill --force --yes`

### cursor-cli
- Missing: integrate
- Suggestion: `super-dev integrate setup --target cursor-cli --force`

### kiro-cli
- Missing: integrate, slash
- Suggestion: `super-dev integrate setup --target kiro-cli --force`
- Suggestion: `super-dev onboard --host kiro-cli --skip-integrate --skip-skill --force --yes`

### qoder-cli
- Missing: integrate, skill, slash
- Suggestion: `super-dev integrate setup --target qoder-cli --force`
- Suggestion: `super-dev skill install super-dev --target qoder-cli --name super-dev-core --force`
- Suggestion: `super-dev onboard --host qoder-cli --skip-integrate --skip-skill --force --yes`

### cursor
- Missing: integrate
- Suggestion: `super-dev integrate setup --target cursor --force`

### kiro
- Missing: integrate
- Suggestion: `super-dev integrate setup --target kiro --force`

### qoder
- Missing: integrate, skill, slash
- Suggestion: `super-dev integrate setup --target qoder --force`
- Suggestion: `super-dev skill install super-dev --target qoder --name super-dev-core --force`
- Suggestion: `super-dev onboard --host qoder --skip-integrate --skip-skill --force --yes`
