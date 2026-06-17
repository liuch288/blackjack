---
name: mobile-scroll-and-feedback-fix
overview: 修复移动端三个问题：1) 练习页面禁止上下橡皮筋滚动；2) 答案界面根据屏幕高度自适应，可滚动查看；3) 确保"下一题"按钮始终可见可点击。
todos:
  - id: global-overscroll
    content: 在 index.css 中为 html/body 添加全局 overscroll-behavior:none，消除 iOS 橡皮筋效果
    status: completed
  - id: lock-body-scroll
    content: 修改 GameTable.tsx：组件挂载时锁定 body 滚动、卸载时恢复，覆盖整个练习生命周期
    status: completed
  - id: fix-overlay-layout
    content: 修改 GameTable.tsx 移动端答案浮层：items-start + overflow-y-auto + max-h-full，并给遮罩层添加 onClick 兜底
    status: completed
  - id: fix-next-button
    content: 修改 FeedbackPanel.tsx 下一题按钮：添加 touch-action:manipulation 消除点击延迟，移除 stopPropagation
    status: completed
---

## 用户需求

修复 Blackjack 策略练习应用在手机端的三个体验问题：

### 1. 练习页面禁止上下拖动

练习页面（展示庄家明牌、玩家手牌、5 个决策按钮时）上下拖动仍有小幅度移动（iOS Safari 橡皮筋效果）。需要在练习模式下完全禁止页面纵向拖动。

### 2. 答案界面显示不完整

回答后弹出的答案反馈浮层在手机上内容超出屏幕，顶部结果（正确/错误标识、EV 对比）被裁切看不到。需要让浮层内容在小屏幕上可完整浏览。

### 3. 下一题按钮偶发点击无响应

答案界面底部的"下一题"按钮有时候点击没有反应。需要确保按钮始终在可点击区域且触摸事件可靠触发。

## 技术方案

### 问题根因分析

| 问题 | 根因 |
| --- | --- |
| 练习页面可拖动 | `GameTable.tsx` 仅在 `showFeedback=true` 时 `body overflow:hidden`，答题中（`showFeedback=false`）body 未锁定；iOS Safari 存在默认 overscroll 橡皮筋 |
| 答案界面顶部裁切 | 移动端浮层使用 `flex items-center justify-center`，FeedbackPanel 内容超过视口高度时，`items-center` 将内容居中导致上半部分被推到屏幕外 |
| 下一题无响应 | 首要原因是问题 2 导致按钮位于屏幕外不可见区域；次要原因是 AnimatedSection 初始 `opacity:0` 在移动端动画未完成前按钮不可交互 |


### 实现方案

#### 修复 1：全局禁用 overscroll + 练习页锁定 body 滚动

- 在 `index.css` 中为 `html, body` 添加 `overscroll-behavior: none`，从根源消除 iOS 橡皮筋效果（不影响页面内部有意义的滚动）
- 在 `GameTable.tsx` 中：组件挂载时设置 `document.body.style.overflow = 'hidden'`，卸载时恢复。这样进入练习 Tab 即锁定 body，切换到历史/设置等 Tab 时恢复正常滚动。移除当前仅依赖 `showFeedback` 的条件判断

#### 修复 2：移动端答案浮层改为可滚动布局

在 `GameTable.tsx` 移动端浮层容器上：

- `items-center` 改为 `items-start`（内容从顶部开始，不会被推出屏幕）
- 添加 `overflow-y-auto overscroll-contain`（浮层内部可滚动，且滚动不穿透到 body）
- 使用 `max-h-full` 限制最大高度为视口高度
- 遮罩层添加 `onClick` 兜底逻辑，点击遮罩也触发下一题（提升触摸命中率）

#### 修复 3：按钮触摸可靠性增强

在 `FeedbackPanel.tsx` 中：

- 为"下一题"按钮添加 `touch-action: manipulation` 内联样式，消除移动端 300ms 点击延迟
- 移除不必要的 `e.stopPropagation()`，避免与遮罩层的兜底点击冲突

### 文件变更清单

```
src/
├── index.css                     # [MODIFY] 添加 html/body overscroll-behavior:none 全局规则
├── components/
│   ├── GameTable.tsx             # [MODIFY] 练习页锁定 body 滚动 + 修复移动端浮层布局
│   └── FeedbackPanel.tsx         # [MODIFY] 按钮添加 touch-action + 移除 stopPropagation
```