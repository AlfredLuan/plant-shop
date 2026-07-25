# 植物展示静态网站（Plant Shop）

这是一个**纯静态**的网站模板，适合长期维护和持续上新植物。

你以后只需要：

1. 把图片和缩略图放进 `images/`
2. 修改 `data/plants.json`

网站就会自动更新。

---

## 1. 文件结构

```text
plant-shop/
├── index.html
├── style.css
├── script.js
├── data/
│   ├── plants.json
│   └── site.json
├── images/
├── assets/
│   └── placeholder.jpg
└── README.md
```

---

## 2. 如何本地打开网站

### 最简单方式（推荐）

使用任意本地静态服务器（例如 VS Code Live Server）打开 `plant-shop/index.html`。

> 注意：因为页面会读取 JSON 文件，直接双击 `index.html` 可能会被浏览器安全策略阻止。

### 无本地服务预览（已内置降级模式）

如果你直接双击打开 `index.html`（`file://`），页面会出现“本地预览模式”提示卡片：

1. 点击“选择 plant-shop 文件夹”
2. 选择整个 `plant-shop/` 目录
3. 页面会自动读取 `data/site.json`、`data/plants.json` 和 `images/` 里的图片并渲染

这个模式只用于本地预览，不改变你原本的维护方式。

---

## 3. 如何新增植物

编辑文件：`data/plants.json`

这是一个数组，每个 `{}` 是一棵植物。网站会按数组顺序显示。

### 单个植物格式

```json
{
  "id": "plant-004",
  "name": {
    "zh": "绿萝",
    "en": "Pothos",
    "sv": "Gullranka"
  },
  "description": {
    "zh": "适合吊挂或高处摆放。",
    "en": "Great for shelves and hanging baskets.",
    "sv": "Perfekt för hyllor och amplar."
  },
  "price": 120,
  "currency": "SEK",
  "images": [
    "pothos-1.jpg",
    "pothos-2.jpg",
    "pothos-3.jpg"
  ],
  "light": {
    "zh": "散射光",
    "en": "Indirect light",
    "sv": "Indirekt ljus"
  },
  "water": {
    "zh": "每周 1 次",
    "en": "Once per week",
    "sv": "En gång i veckan"
  },
  "sold": false
}
```

### 字段说明

- `id`：唯一编号，不要重复。
- `name`：植物名（多语言）。
- `description`：简介（多语言）。
- `price`：价格数字（不要加货币符号）。
- `currency`：货币代码（如 `SEK`、`CNY`、`USD`）。
- `images`：图片列表（按顺序显示，第一张为默认主图）。
- `light`：光照需求（多语言）。
- `water`：浇水频率（多语言）。
- `sold`：是否售出，`true` 显示“已售出”标签。

---

## 4. 如何修改价格

仍然在 `data/plants.json`：

- 修改某个植物的 `price`
- 或修改 `currency`

示例：

```json
"price": 299,
"currency": "SEK"
```

---

## 5. 如何修改图片（支持多图与缩略图）

1. 把新图片文件放到 `images/`
2. 在对应植物里改 `images` 数组

例如：

```json
"images": ["my-plant-1.jpg", "my-plant-2.jpg"]
```

### 缩略图规则（用于更快加载）

- 系统会优先读取同名缩略图：`文件名-thumb.后缀`
- 例如：`my-plant-1.jpg` 会优先匹配 `my-plant-1-thumb.jpg`
- 如果没有缩略图，会自动回退到原图

也可以在 `images` 里写对象，手动指定缩略图：

```json
"images": [
  { "full": "my-plant-1.jpg", "thumb": "my-plant-1-small.jpg" },
  { "full": "my-plant-2.jpg", "thumb": "my-plant-2-small.jpg" }
]
```

如果图片不存在，网站会自动显示 `assets/placeholder.jpg` 占位图。

---

## 6. 如何修改联系邮箱

编辑：`data/site.json`

找到：

```json
"contactEmail": "hello@example.com"
```

改成你的邮箱即可。

---

## 7. 如何修改网站标题、界面文字

编辑：`data/site.json`

### 网站标题

```json
"siteTitle": {
  "zh": "出售我的植物",
  "en": "Plants for Sale",
  "sv": "Växter till salu"
}
```

### 界面文案（价格、光照、浇水、已售出、联系邮箱等）

都在：

```json
"uiText": { ... }
```

你只需要改这个 JSON，不需要改代码。

---

## 8. 如何增加新语言（重要）

假设要新增德语 `de`：

### 步骤 1：在 `site.json` 增加语言按钮

```json
"languages": [
  { "code": "zh", "label": "中文" },
  { "code": "en", "label": "English" },
  { "code": "sv", "label": "Svenska" },
  { "code": "de", "label": "Deutsch" }
]
```

### 步骤 2：给 `siteTitle` 和 `uiText` 所有字段增加 `de`

示例：

```json
"priceLabel": {
  "zh": "价格",
  "en": "Price",
  "sv": "Pris",
  "de": "Preis"
}
```

### 步骤 3：给 `plants.json` 每棵植物增加 `de`

需要补充字段：

- `name.de`
- `description.de`
- `light.de`
- `water.de`

完成后刷新页面即可看到新语言。

---

## 9. site.json 完整字段说明

```json
{
  "siteTitle": { "zh": "", "en": "", "sv": "" },
  "defaultLanguage": "zh",
  "contactEmail": "",
  "defaultCurrency": "SEK",
  "languages": [
    { "code": "zh", "label": "中文" },
    { "code": "en", "label": "English" },
    { "code": "sv", "label": "Svenska" }
  ],
  "uiText": {
    "priceLabel": { "zh": "", "en": "", "sv": "" },
    "lightLabel": { "zh": "", "en": "", "sv": "" },
    "waterLabel": { "zh": "", "en": "", "sv": "" },
    "soldLabel": { "zh": "", "en": "", "sv": "" },
    "contactLabel": { "zh": "", "en": "", "sv": "" },
    "loadError": { "zh": "", "en": "", "sv": "" }
  }
}
```

---

## 10. 常见问题

- 页面不显示植物：通常是 `plants.json` 格式有错误（比如少逗号）。
- 图片不显示：检查 `images/` 里文件名是否与 `images` 中的文件名完全一致（含后缀）。
- 切换语言没变化：检查该语言在 `site.json` 和 `plants.json` 中是否都已填写。

---

## 11. 维护建议

- 每次修改 JSON 后，先用 JSON 校验工具检查格式。
- `id` 保持唯一，避免重复。
- 图片建议统一尺寸比例（例如 4:3），视觉更整齐。
- 可定期备份 `data/` 和 `images/`。
