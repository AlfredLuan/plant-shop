/**
 * 静态植物网站主脚本。
 * 目标：
 * 1) 从 JSON 加载配置与数据；
 * 2) 支持运行时三语切换；
 * 3) 基于数据渲染植物卡片；
 * 4) 支持图片 Lightbox。
 */

const DATA_PATHS = {
  site: './data/site.json',
  plants: './data/plants.json'
};

const DEFAULTS = {
  fallbackLanguage: 'zh',
  placeholderImage: './assets/placeholder.jpg',
  imagesBasePath: './images/'
};

const state = {
  siteConfig: null,
  plants: [],
  currentLanguage: DEFAULTS.fallbackLanguage,
  localImageObjectUrls: new Map()
};

const elements = {
  htmlRoot: document.documentElement,
  siteTitle: document.querySelector('#site-title'),
  languageSwitcher: document.querySelector('#language-switcher'),
  plantsGrid: document.querySelector('#plants-grid'),
  purchaseHint: document.querySelector('#purchase-hint'),
  contactLabel: document.querySelector('#contact-label'),
  contactEmailLink: document.querySelector('#contact-email-link'),
  cardTemplate: document.querySelector('#plant-card-template'),
  lightbox: document.querySelector('#lightbox'),
  lightboxImage: document.querySelector('#lightbox-image'),
  lightboxClose: document.querySelector('#lightbox-close')
};

/**
 * 安全读取对象中的多语言字段。
 * 若目标语言缺失，则回退到默认语言。
 * @param {Object<string, string>} localizedField - 形如 { zh: 'xx', en: 'xx' }
 * @returns {string}
 */
function getLocalizedText(localizedField) {
  if (!localizedField || typeof localizedField !== 'object') {
    return '';
  }

  return (
    localizedField[state.currentLanguage] ??
    localizedField[state.siteConfig.defaultLanguage] ??
    localizedField[DEFAULTS.fallbackLanguage] ??
    ''
  );
}

/**
 * 将价格格式化为当前语言对应样式。
 * @param {number} amount - 数值价格
 * @param {string} currency - ISO 货币代码，如 SEK
 * @returns {string}
 */
function formatPrice(amount, currency) {
  const normalizedCurrency = currency || state.siteConfig.defaultCurrency;
  const localeMap = {
    zh: 'zh-CN',
    en: 'en-US',
    sv: 'sv-SE'
  };

  try {
    return new Intl.NumberFormat(localeMap[state.currentLanguage] || 'zh-CN', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${amount} ${normalizedCurrency}`;
  }
}

/**
 * 根据文件名构建图片路径。
 * @param {string} imageName - 例如 monstera.jpg
 * @returns {string}
 */
function buildImagePath(imageName) {
  if (!imageName) {
    return DEFAULTS.placeholderImage;
  }

  if (state.localImageObjectUrls.has(imageName)) {
    return state.localImageObjectUrls.get(imageName);
  }

  return `${DEFAULTS.imagesBasePath}${imageName}`;
}

/**
 * 回收由 URL.createObjectURL 生成的本地图片 URL，避免内存泄漏。
 */
function resetLocalImageObjectUrls() {
  state.localImageObjectUrls.forEach((objectUrl) => {
    URL.revokeObjectURL(objectUrl);
  });

  state.localImageObjectUrls.clear();
}

/**
 * 为大图文件名推导默认缩略图文件名。
 * 例如 monstera.jpg -> monstera-thumb.jpg
 * @param {string} imageName
 * @returns {string}
 */
function buildDefaultThumbnailName(imageName) {
  if (!imageName || typeof imageName !== 'string') {
    return '';
  }

  const dotIndex = imageName.lastIndexOf('.');
  if (dotIndex <= 0) {
    return `${imageName}-thumb`;
  }

  const basename = imageName.slice(0, dotIndex);
  const extension = imageName.slice(dotIndex);
  return `${basename}-thumb${extension}`;
}

/**
 * 标准化植物图片配置，统一输出全图/缩略图映射。
 * 兼容两种写法：
 * 1) 旧格式：image: "a.jpg"
 * 2) 新格式：images: ["a.jpg", { "full": "b.jpg", "thumb": "b-thumb.jpg" }]
 * @param {Object} plant
 * @returns {Array<{full: string, thumb: string}>}
 */
function normalizePlantImages(plant) {
  const normalizedImages = [];

  if (Array.isArray(plant.images) && plant.images.length > 0) {
    plant.images.forEach((item) => {
      if (typeof item === 'string') {
        normalizedImages.push({
          full: item,
          thumb: buildDefaultThumbnailName(item)
        });
        return;
      }

      if (item && typeof item === 'object') {
        const fullImageName = item.full || item.image || '';
        const thumbImageName = item.thumb || item.thumbnail || buildDefaultThumbnailName(fullImageName);

        if (fullImageName) {
          normalizedImages.push({
            full: fullImageName,
            thumb: thumbImageName
          });
        }
      }
    });
  }

  if (normalizedImages.length === 0 && plant.image) {
    normalizedImages.push({
      full: plant.image,
      thumb: buildDefaultThumbnailName(plant.image)
    });
  }

  if (normalizedImages.length === 0) {
    normalizedImages.push({
      full: '',
      thumb: ''
    });
  }

  return normalizedImages;
}

/**
 * 创建语言切换按钮。
 * 所有语言信息由 site.json 提供，避免写死。
 */
function renderLanguageSwitcher() {
  const { languages } = state.siteConfig;
  elements.languageSwitcher.innerHTML = '';

  languages.forEach((language) => {
    const button = document.createElement('button');
    button.className = 'language-button';
    button.type = 'button';
    button.textContent = language.label;
    button.dataset.language = language.code;
    button.setAttribute('aria-pressed', String(language.code === state.currentLanguage));

    button.addEventListener('click', () => {
      state.currentLanguage = language.code;
      renderAll();
    });

    elements.languageSwitcher.appendChild(button);
  });
}

/**
 * 渲染网站头部与页脚文案。
 */
function renderSiteChrome() {
  const texts = state.siteConfig.uiText;
  const email = state.siteConfig.contactEmail;

  elements.siteTitle.textContent = getLocalizedText(state.siteConfig.siteTitle);
  elements.purchaseHint.textContent = getLocalizedText(texts.purchaseHint);
  elements.contactLabel.textContent = getLocalizedText(texts.contactLabel);
  elements.contactEmailLink.textContent = email;
  elements.contactEmailLink.href = `mailto:${email}`;
  document.title = getLocalizedText(state.siteConfig.siteTitle);

  // 更新 html lang，提高可访问性和 SEO 表现。
  const langMap = { zh: 'zh-CN', en: 'en', sv: 'sv' };
  elements.htmlRoot.lang = langMap[state.currentLanguage] || 'zh-CN';
}

/**
 * 创建并返回单张植物卡片节点。
 * @param {Object} plant - 单个植物数据对象
 * @returns {HTMLElement}
 */
function createPlantCard(plant) {
  const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);

  const image = card.querySelector('.card-image');
  const thumbnailsNode = card.querySelector('.card-thumbnails');
  const soldBadge = card.querySelector('.sold-badge');
  const nameNode = card.querySelector('.plant-name');
  const priceNode = card.querySelector('.plant-price');
  const descriptionNode = card.querySelector('.plant-description');
  const lightLabelNode = card.querySelector('.meta-light-label');
  const lightValueNode = card.querySelector('.meta-light-value');
  const waterLabelNode = card.querySelector('.meta-water-label');
  const waterValueNode = card.querySelector('.meta-water-value');

  const texts = state.siteConfig.uiText;

  const localizedName = getLocalizedText(plant.name);
  const localizedDescription = getLocalizedText(plant.description);
  const localizedLight = getLocalizedText(plant.light);
  const localizedWater = getLocalizedText(plant.water);
  const plantImages = normalizePlantImages(plant);

  /**
   * 设置卡片主图并记录当前选中图片名。
   * @param {string} fullImageName
   */
  function setMainImage(fullImageName) {
    image.dataset.fallbackApplied = 'false';
    image.dataset.fullImageName = fullImageName || '';
    image.src = buildImagePath(fullImageName);
    image.alt = localizedName;
  }

  setMainImage(plantImages[0].full);

  // 图片加载失败时自动显示占位图。
  image.addEventListener('error', () => {
    if (image.dataset.fallbackApplied === 'true') {
      return;
    }

    image.dataset.fallbackApplied = 'true';
    image.src = DEFAULTS.placeholderImage;
  });

  // 点击卡片图片时打开 Lightbox 大图。
  image.addEventListener('click', () => {
    openLightbox(image.src, localizedName);
  });

  // 渲染缩略图列表，点击可切换当前主图。
  plantImages.forEach((item, index) => {
    const thumbnailButton = document.createElement('button');
    thumbnailButton.type = 'button';
    thumbnailButton.className = 'card-thumbnail-button';
    thumbnailButton.setAttribute('aria-label', localizedName);

    const thumbnailImage = document.createElement('img');
    thumbnailImage.className = 'card-thumbnail-image';
    thumbnailImage.loading = 'lazy';
    thumbnailImage.decoding = 'async';
    thumbnailImage.alt = localizedName;
    thumbnailImage.dataset.errorStage = 'thumb';
    thumbnailImage.src = buildImagePath(item.thumb);

    thumbnailImage.addEventListener('error', () => {
      if (thumbnailImage.dataset.errorStage === 'done') {
        return;
      }

      if (thumbnailImage.dataset.errorStage === 'thumb') {
        thumbnailImage.dataset.errorStage = 'full';
        thumbnailImage.src = buildImagePath(item.full);
        return;
      }

      thumbnailImage.dataset.errorStage = 'done';
      thumbnailImage.src = DEFAULTS.placeholderImage;
    });

    thumbnailButton.addEventListener('click', () => {
      setMainImage(item.full);

      thumbnailsNode.querySelectorAll('.card-thumbnail-button').forEach((button) => {
        button.classList.remove('is-active');
      });

      thumbnailButton.classList.add('is-active');
    });

    if (index === 0) {
      thumbnailButton.classList.add('is-active');
    }

    thumbnailButton.appendChild(thumbnailImage);
    thumbnailsNode.appendChild(thumbnailButton);
  });

  nameNode.textContent = localizedName;
  priceNode.textContent = `${getLocalizedText(texts.priceLabel)}: ${formatPrice(plant.price, plant.currency)}`;
  descriptionNode.textContent = localizedDescription;
  lightLabelNode.textContent = `${getLocalizedText(texts.lightLabel)}:`;
  lightValueNode.textContent = localizedLight;
  waterLabelNode.textContent = `${getLocalizedText(texts.waterLabel)}:`;
  waterValueNode.textContent = localizedWater;

  if (plant.sold === true) {
    soldBadge.hidden = false;
    soldBadge.textContent = getLocalizedText(texts.soldLabel);
  }

  return card;
}

/**
 * 按 JSON 顺序渲染所有植物卡片。
 */
function renderPlants() {
  elements.plantsGrid.innerHTML = '';

  const fragment = document.createDocumentFragment();
  state.plants.forEach((plant) => {
    fragment.appendChild(createPlantCard(plant));
  });

  elements.plantsGrid.appendChild(fragment);
}

/**
 * 打开 Lightbox。
 * @param {string} imageSrc - 图片地址
 * @param {string} altText - 图片替代文本
 */
function openLightbox(imageSrc, altText) {
  elements.lightboxImage.src = imageSrc;
  elements.lightboxImage.alt = altText;
  elements.lightbox.classList.add('open');
  elements.lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

/**
 * 关闭 Lightbox。
 */
function closeLightbox() {
  elements.lightbox.classList.remove('open');
  elements.lightbox.setAttribute('aria-hidden', 'true');
  elements.lightboxImage.src = '';
  document.body.style.overflow = '';
}

/**
 * 为 Lightbox 绑定交互事件。
 */
function setupLightboxEvents() {
  elements.lightboxClose.addEventListener('click', closeLightbox);

  elements.lightbox.addEventListener('click', (event) => {
    if (event.target === elements.lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.lightbox.classList.contains('open')) {
      closeLightbox();
    }
  });
}

/**
 * 一次性刷新整个页面内容（不刷新浏览器）。
 */
function renderAll() {
  renderLanguageSwitcher();
  renderSiteChrome();
  renderPlants();
}

/**
 * 加载 JSON 数据。
 * @param {string} url - 数据文件地址
 * @returns {Promise<any>}
 */
async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load JSON: ${url}`);
  }

  return response.json();
}

/**
 * 从 File 对象读取并解析 JSON。
 * @param {File} file
 * @returns {Promise<any>}
 */
async function parseJsonFile(file) {
  const jsonText = await file.text();
  return JSON.parse(jsonText);
}

/**
 * 在文件列表中按后缀查找目标文件。
 * @param {File[]} files
 * @param {string[]} suffixes
 * @returns {File | undefined}
 */
function findFileBySuffix(files, suffixes) {
  return files.find((file) => {
    const normalizedPath = (file.webkitRelativePath || file.name).replaceAll('\\\\', '/').toLowerCase();
    return suffixes.some((suffix) => normalizedPath.endsWith(suffix));
  });
}

/**
 * 将 images 目录中的本地文件映射为可访问的 blob URL。
 * @param {File[]} files
 */
function loadLocalImageObjectUrls(files) {
  resetLocalImageObjectUrls();

  files.forEach((file) => {
    const normalizedPath = (file.webkitRelativePath || file.name).replaceAll('\\\\', '/').toLowerCase();
    if (!normalizedPath.includes('/images/')) {
      return;
    }

    const fileName = file.name;
    const objectUrl = URL.createObjectURL(file);
    state.localImageObjectUrls.set(fileName, objectUrl);
  });
}

/**
 * 在 file:// 模式下，允许用户手动选择项目目录以加载数据和图片。
 */
function renderLocalPreviewHelper() {
  elements.plantsGrid.innerHTML = '';

  const helper = document.createElement('section');
  helper.className = 'preview-helper';

  const title = document.createElement('h2');
  title.textContent = '本地预览模式';

  const description = document.createElement('p');
  description.textContent = '当前通过 file:// 打开。请点击下方按钮并选择 plant-shop 文件夹，以加载 data 与 images。';

  const loadButton = document.createElement('button');
  loadButton.className = 'preview-helper-button';
  loadButton.type = 'button';
  loadButton.textContent = '选择 plant-shop 文件夹';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.setAttribute('webkitdirectory', '');
  fileInput.hidden = true;

  const feedback = document.createElement('p');
  feedback.className = 'preview-helper-feedback';
  feedback.textContent = '';

  loadButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const selectedFiles = Array.from(fileInput.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const siteFile = findFileBySuffix(selectedFiles, ['/data/site.json', 'site.json']);
    const plantsFile = findFileBySuffix(selectedFiles, ['/data/plants.json', 'plants.json']);

    if (!siteFile || !plantsFile) {
      feedback.textContent = '未找到 data/site.json 或 data/plants.json，请重新选择 plant-shop 文件夹。';
      return;
    }

    try {
      const siteConfig = await parseJsonFile(siteFile);
      const plants = await parseJsonFile(plantsFile);

      loadLocalImageObjectUrls(selectedFiles);

      state.siteConfig = siteConfig;
      state.plants = plants;
      state.currentLanguage = siteConfig.defaultLanguage || DEFAULTS.fallbackLanguage;

      renderAll();
    } catch (error) {
      console.error(error);
      feedback.textContent = '读取失败，请检查 JSON 格式后重试。';
    }
  });

  helper.append(title, description, loadButton, fileInput, feedback);
  elements.plantsGrid.appendChild(helper);
}

/**
 * 初始化应用。
 */
async function init() {
  setupLightboxEvents();

  try {
    const siteConfig = await loadJson(DATA_PATHS.site);
    const plants = await loadJson(DATA_PATHS.plants);

    resetLocalImageObjectUrls();
    state.siteConfig = siteConfig;
    state.plants = plants;
    state.currentLanguage = siteConfig.defaultLanguage || DEFAULTS.fallbackLanguage;

    renderAll();
  } catch (error) {
    console.error(error);

    if (window.location.protocol === 'file:') {
      renderLocalPreviewHelper();
      return;
    }

    const errorText = state.siteConfig
      ? getLocalizedText(state.siteConfig.uiText.loadError)
      : 'Failed to load site configuration.';

    elements.plantsGrid.textContent = errorText;
  }
}

init();
