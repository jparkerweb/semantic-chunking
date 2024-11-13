/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.js
var main_exports = {};
__export(main_exports, {
  default: () => main_default
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/modals.js
var import_obsidian = require("obsidian");
var ReleaseNotesModal = class extends import_obsidian.Modal {
  constructor(app, plugin, version, releaseNotes2) {
    super(app);
    this.plugin = plugin;
    this.version = version;
    this.releaseNotes = releaseNotes2;
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: `Welcome to \u{1F9B6} Rich Foot v${this.version}` });
    contentEl.createEl("p", {
      text: "After each update you'll be prompted with the release notes. You can disable this in the plugin settings.",
      cls: "release-notes-instructions"
    });
    const kofiContainer = contentEl.createEl("div");
    kofiContainer.style.textAlign = "right";
    const kofiLink = kofiContainer.createEl("a", {
      href: "https://ko-fi.com/jparkerweb",
      target: "_blank"
    });
    kofiLink.createEl("img", {
      attr: {
        height: "36",
        style: "border:0px;height:36px;",
        src: "https://raw.githubusercontent.com/jparkerweb/rich-foot/refs/heads/main/img/support.png",
        border: "0",
        alt: "Buy Me a Coffee at ko-fi.com"
      }
    });
    const notesContainer = contentEl.createDiv("release-notes-container");
    await import_obsidian.MarkdownRenderer.renderMarkdown(
      this.releaseNotes,
      notesContainer,
      "",
      this.plugin,
      this
    );
    contentEl.createEl("div", { cls: "release-notes-spacer" }).style.height = "20px";
    new import_obsidian.Setting(contentEl).addButton((btn) => btn.setButtonText("Close").onClick(() => this.close()));
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};

// virtual-module:virtual:release-notes
var releaseNotes = '<h2>\u{1F389} What&#39;s New</h2>\n<h3>v1.6.0</h3>\n<h4>New Color Customization Options</h4>\n<ul>\n<li>New Border, Links, and Date color customization options in settings<ul>\n<li>Color picker to select custom colors</li>\n<li>Reset button to restore default colors (theme accent color)</li>\n<li>Real-time color updates</li>\n</ul>\n</li>\n</ul>\n<p><img src="https://raw.githubusercontent.com/jparkerweb/rich-foot/refs/heads/main/img/releases/rich-foot-v1.6.0.jpg" alt="New Color Customization Options"></p>\n';

// src/main.js
var DEFAULT_SETTINGS = {
  borderWidth: 1,
  borderStyle: "dashed",
  borderOpacity: 1,
  borderRadius: 15,
  datesOpacity: 1,
  linksOpacity: 1,
  showReleaseNotes: true,
  excludedFolders: [],
  dateColor: "var(--text-accent)",
  borderColor: "var(--text-accent)",
  linkColor: "var(--link-color)",
  linkBackgroundColor: "var(--tag-background)",
  linkBorderColor: "rgba(255, 255, 255, 0.204)"
};
function rgbToHex(color) {
  if (color.startsWith("hsl")) {
    const temp = document.createElement("div");
    temp.style.color = color;
    document.body.appendChild(temp);
    color = getComputedStyle(temp).color;
    document.body.removeChild(temp);
  }
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return "#000000";
  const [r, g, b] = rgb.slice(0, 3).map((x) => {
    const val = Math.min(255, Math.max(0, Math.round(parseFloat(x))));
    return val.toString(16).padStart(2, "0");
  });
  return `#${r}${g}${b}`;
}
function blendRgbaWithBackground(rgba, backgroundRgb) {
  const rgbaMatch = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(\d*\.?\d+)\)/);
  if (!rgbaMatch) return null;
  const [, fr, fg, fb, fa] = rgbaMatch.map(Number);
  const alpha = fa !== void 0 ? fa : 1;
  const rgbMatch = backgroundRgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) return null;
  const [, br, bg, bb] = rgbMatch.map(Number);
  const r = Math.round(fr * alpha + br * (1 - alpha));
  const g = Math.round(fg * alpha + bg * (1 - alpha));
  const b = Math.round(fb * alpha + bb * (1 - alpha));
  return `rgb(${r}, ${g}, ${b})`;
}
var RichFootPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    await this.loadSettings();
    document.documentElement.style.setProperty("--rich-foot-border-width", `${this.settings.borderWidth}px`);
    document.documentElement.style.setProperty("--rich-foot-border-style", this.settings.borderStyle);
    document.documentElement.style.setProperty("--rich-foot-border-opacity", this.settings.borderOpacity);
    document.documentElement.style.setProperty("--rich-foot-border-radius", `${this.settings.borderRadius}px`);
    document.documentElement.style.setProperty("--rich-foot-dates-opacity", this.settings.datesOpacity);
    document.documentElement.style.setProperty("--rich-foot-links-opacity", this.settings.linksOpacity);
    await this.checkVersion();
    this.updateRichFoot = (0, import_obsidian2.debounce)(this.updateRichFoot.bind(this), 100, true);
    this.addSettingTab(new RichFootSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => {
      this.registerEvent(
        this.app.workspace.on("layout-change", this.updateRichFoot)
      );
      this.registerEvent(
        this.app.workspace.on("active-leaf-change", this.updateRichFoot)
      );
      this.registerEvent(
        this.app.workspace.on("file-open", this.updateRichFoot)
      );
      this.registerEvent(
        this.app.workspace.on("editor-change", this.updateRichFoot)
      );
      this.updateRichFoot();
    });
    this.contentObserver = new MutationObserver(this.updateRichFoot);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    document.documentElement.style.setProperty("--rich-foot-date-color", this.settings.dateColor);
    if (!Array.isArray(this.settings.excludedFolders)) {
      this.settings.excludedFolders = [];
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async checkVersion() {
    const currentVersion = this.manifest.version;
    const lastVersion = this.settings.lastVersion;
    const shouldShow = this.settings.showReleaseNotes && (!lastVersion || lastVersion !== currentVersion);
    if (shouldShow) {
      const releaseNotes2 = await this.getReleaseNotes(currentVersion);
      new ReleaseNotesModal(this.app, this, currentVersion, releaseNotes2).open();
      this.settings.lastVersion = currentVersion;
      await this.saveSettings();
    }
  }
  async getReleaseNotes(version) {
    return releaseNotes;
  }
  updateRichFoot() {
    document.documentElement.style.setProperty("--rich-foot-border-width", `${this.settings.borderWidth}px`);
    document.documentElement.style.setProperty("--rich-foot-border-style", this.settings.borderStyle);
    document.documentElement.style.setProperty("--rich-foot-border-opacity", this.settings.borderOpacity);
    document.documentElement.style.setProperty("--rich-foot-border-radius", `${this.settings.borderRadius}px`);
    document.documentElement.style.setProperty("--rich-foot-dates-opacity", this.settings.datesOpacity);
    document.documentElement.style.setProperty("--rich-foot-links-opacity", this.settings.linksOpacity);
    document.documentElement.style.setProperty("--rich-foot-date-color", this.settings.dateColor);
    document.documentElement.style.setProperty("--rich-foot-border-color", this.settings.borderColor);
    document.documentElement.style.setProperty("--rich-foot-link-color", this.settings.linkColor);
    document.documentElement.style.setProperty("--rich-foot-link-background", this.settings.linkBackgroundColor);
    document.documentElement.style.setProperty("--rich-foot-link-border-color", this.settings.linkBorderColor);
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf && activeLeaf.view instanceof import_obsidian2.MarkdownView) {
      this.addRichFoot(activeLeaf.view);
    }
  }
  addRichFoot(view) {
    const file = view.file;
    if (!file || !file.path) {
      return;
    }
    if (this.shouldExcludeFile(file.path)) {
      const content2 = view.contentEl;
      let container2;
      if (view.getMode() === "preview") {
        container2 = content2.querySelector(".markdown-preview-section");
      } else if (view.getMode() === "source" || view.getMode() === "live") {
        container2 = content2.querySelector(".cm-sizer");
      }
      if (container2) {
        this.removeExistingRichFoot(container2);
      }
      return;
    }
    const content = view.contentEl;
    let container;
    if (view.getMode() === "preview") {
      container = content.querySelector(".markdown-preview-section");
    } else if (view.getMode() === "source" || view.getMode() === "live") {
      container = content.querySelector(".cm-sizer");
    }
    if (!container) {
      return;
    }
    this.removeExistingRichFoot(container);
    const richFoot = this.createRichFoot(file);
    if (view.getMode() === "source" || view.getMode() === "live") {
      container.appendChild(richFoot);
    } else {
      container.appendChild(richFoot);
    }
    this.observeContainer(container);
  }
  removeExistingRichFoot(container) {
    var _a;
    const existingRichFoot = container.querySelector(".rich-foot");
    if (existingRichFoot) {
      existingRichFoot.remove();
    }
    const cmSizer = (_a = container.closest(".cm-editor")) == null ? void 0 : _a.querySelector(".cm-sizer");
    if (cmSizer) {
      const richFootInSizer = cmSizer.querySelector(".rich-foot");
      if (richFootInSizer) {
        richFootInSizer.remove();
      }
    }
  }
  observeContainer(container) {
    if (this.containerObserver) {
      this.containerObserver.disconnect();
    }
    this.containerObserver = new MutationObserver((mutations) => {
      const richFoot = container.querySelector(".rich-foot");
      if (!richFoot) {
        this.addRichFoot(this.app.workspace.activeLeaf.view);
      }
    });
    this.containerObserver.observe(container, { childList: true, subtree: true });
  }
  createRichFoot(file) {
    const richFoot = createDiv({ cls: "rich-foot" });
    const richFootDashedLine = richFoot.createDiv({ cls: "rich-foot--dashed-line" });
    if (this.settings.showBacklinks) {
      const backlinksData = this.app.metadataCache.getBacklinksForFile(file);
      if ((backlinksData == null ? void 0 : backlinksData.data) && backlinksData.data.size > 0) {
        const backlinksDiv = richFoot.createDiv({ cls: "rich-foot--backlinks" });
        const backlinksUl = backlinksDiv.createEl("ul");
        for (const [linkPath, linkData] of backlinksData.data) {
          if (!linkPath.endsWith(".md")) continue;
          const li = backlinksUl.createEl("li");
          const link = li.createEl("a", {
            href: linkPath,
            text: linkPath.split("/").pop().slice(0, -3)
          });
          link.addEventListener("click", (event) => {
            event.preventDefault();
            this.app.workspace.openLinkText(linkPath, file.path);
          });
        }
        if (backlinksUl.childElementCount === 0) {
          backlinksDiv.remove();
        }
      }
    }
    if (this.settings.showOutlinks) {
      const outlinks = this.getOutlinks(file);
      if (outlinks.size > 0) {
        const outlinksDiv = richFoot.createDiv({ cls: "rich-foot--outlinks" });
        const outlinksUl = outlinksDiv.createEl("ul");
        for (const linkPath of outlinks) {
          const parts = linkPath.split("/");
          const displayName = parts[parts.length - 1].slice(0, -3);
          const li = outlinksUl.createEl("li");
          const link = li.createEl("a", {
            href: linkPath,
            text: displayName
          });
          link.addEventListener("click", (event) => {
            event.preventDefault();
            this.app.workspace.openLinkText(linkPath, file.path);
          });
        }
      }
    }
    if (this.settings.showDates) {
      const datesWrapper = richFoot.createDiv({ cls: "rich-foot--dates-wrapper" });
      const fileUpdate = new Date(file.stat.mtime);
      const modified = `${fileUpdate.toLocaleString("default", { month: "long" })} ${fileUpdate.getDate()}, ${fileUpdate.getFullYear()}`;
      datesWrapper.createDiv({
        cls: "rich-foot--modified-date",
        text: `${modified}`
      });
      const fileCreated = new Date(file.stat.ctime);
      const created = `${fileCreated.toLocaleString("default", { month: "long" })} ${fileCreated.getDate()}, ${fileCreated.getFullYear()}`;
      datesWrapper.createDiv({
        cls: "rich-foot--created-date",
        text: `${created}`
      });
    }
    return richFoot;
  }
  getOutlinks(file) {
    var _a, _b;
    const cache = this.app.metadataCache.getFileCache(file);
    const links = /* @__PURE__ */ new Set();
    if (cache == null ? void 0 : cache.links) {
      for (const link of cache.links) {
        const targetFile = this.app.metadataCache.getFirstLinkpathDest(link.link, file.path);
        if (targetFile && targetFile.extension === "md") {
          links.add(targetFile.path);
        }
      }
    }
    if ((_a = cache == null ? void 0 : cache.frontmatter) == null ? void 0 : _a.links) {
      const frontmatterLinks = cache.frontmatter.links;
      if (Array.isArray(frontmatterLinks)) {
        for (const link of frontmatterLinks) {
          const linkText = (_b = link.match(/\[\[(.*?)\]\]/)) == null ? void 0 : _b[1];
          if (linkText) {
            const targetFile = this.app.metadataCache.getFirstLinkpathDest(linkText, file.path);
            if (targetFile && targetFile.extension === "md") {
              links.add(targetFile.path);
            }
          }
        }
      }
    }
    return links;
  }
  onunload() {
    this.contentObserver.disconnect();
    if (this.richFootIntervalId) {
      clearInterval(this.richFootIntervalId);
    }
    if (this.containerObserver) {
      this.containerObserver.disconnect();
    }
  }
  // Add this method to check if a file should be excluded
  shouldExcludeFile(filePath) {
    var _a;
    if (!((_a = this.settings) == null ? void 0 : _a.excludedFolders)) {
      return false;
    }
    return this.settings.excludedFolders.some((folder) => filePath.startsWith(folder));
  }
};
var RichFootSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    var _a;
    let { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("rich-foot-settings");
    containerEl.createEl("div", { cls: "rich-foot-info", text: "\u{1F9B6} Rich Foot adds a footer to your notes with useful information such as backlinks, creation date, and last modified date. Use the settings below to customize the appearance." });
    containerEl.createEl("h3", { text: "Excluded Folders" });
    containerEl.createEl("p", {
      text: "Notes in excluded folders (and their subfolders) will not display the Rich Foot footer. This is useful for system folders or areas where you don't want footer information to appear.",
      cls: "setting-item-description"
    });
    const excludedFoldersContainer = containerEl.createDiv("excluded-folders-container");
    if ((_a = this.plugin.settings) == null ? void 0 : _a.excludedFolders) {
      this.plugin.settings.excludedFolders.forEach((folder, index) => {
        const folderDiv = excludedFoldersContainer.createDiv("excluded-folder-item");
        folderDiv.createSpan({ text: folder });
        const deleteButton = folderDiv.createEl("button", {
          text: "Delete",
          cls: "excluded-folder-delete"
        });
        deleteButton.addEventListener("click", async () => {
          this.plugin.settings.excludedFolders.splice(index, 1);
          await this.plugin.saveSettings();
          this.display();
        });
      });
    }
    const newFolderSetting = new import_obsidian2.Setting(containerEl).setName("Add excluded folder").setDesc("Enter a folder path or browse to select").addText((text) => text.setPlaceholder("folder/subfolder").onChange(() => {
    })).addButton((button) => button.setButtonText("Browse").onClick(async () => {
      const folder = await this.browseForFolder();
      if (folder) {
        const textComponent = newFolderSetting.components[0];
        textComponent.setValue(folder);
      }
    })).addButton((button) => button.setButtonText("Add").onClick(async () => {
      const textComponent = newFolderSetting.components[0];
      const newFolder = textComponent.getValue().trim();
      if (newFolder && !this.plugin.settings.excludedFolders.includes(newFolder)) {
        this.plugin.settings.excludedFolders.push(newFolder);
        await this.plugin.saveSettings();
        textComponent.setValue("");
        this.display();
      }
    }));
    containerEl.createEl("h3", { text: "Visibility Settings" });
    new import_obsidian2.Setting(containerEl).setName("Show Backlinks").setDesc("Show backlinks in the footer").addToggle((toggle) => toggle.setValue(this.plugin.settings.showBacklinks).onChange(async (value) => {
      this.plugin.settings.showBacklinks = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    }));
    new import_obsidian2.Setting(containerEl).setName("Show Outlinks").setDesc("Show outgoing links in the footer").addToggle((toggle) => toggle.setValue(this.plugin.settings.showOutlinks).onChange(async (value) => {
      this.plugin.settings.showOutlinks = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    }));
    new import_obsidian2.Setting(containerEl).setName("Show Dates").setDesc("Show creation and modification dates in the footer").addToggle((toggle) => toggle.setValue(this.plugin.settings.showDates).onChange(async (value) => {
      this.plugin.settings.showDates = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    }));
    containerEl.createEl("h3", { text: "Style Settings" });
    new import_obsidian2.Setting(containerEl).setName("Border Width").setDesc("Adjust the width of the footer border (1-10px)").addSlider((slider) => slider.setLimits(1, 10, 1).setValue(this.plugin.settings.borderWidth).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.borderWidth = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.borderWidth = DEFAULT_SETTINGS.borderWidth;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const slider = this.containerEl.querySelector('input[type="range"]');
      if (slider) slider.value = DEFAULT_SETTINGS.borderWidth;
    }));
    new import_obsidian2.Setting(containerEl).setName("Border Style").setDesc("Choose the style of the footer border").addDropdown((dropdown) => dropdown.addOptions({
      "solid": "Solid",
      "dashed": "Dashed",
      "dotted": "Dotted",
      "double": "Double",
      "groove": "Groove",
      "ridge": "Ridge",
      "inset": "Inset",
      "outset": "Outset"
    }).setValue(this.plugin.settings.borderStyle).onChange(async (value) => {
      this.plugin.settings.borderStyle = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.borderStyle = DEFAULT_SETTINGS.borderStyle;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const dropdown = this.containerEl.querySelector("select");
      if (dropdown) dropdown.value = DEFAULT_SETTINGS.borderStyle;
    }));
    new import_obsidian2.Setting(containerEl).setName("Border Opacity").setDesc("Adjust the opacity of the footer border (0-1)").addSlider((slider) => slider.setLimits(0, 1, 0.1).setValue(this.plugin.settings.borderOpacity).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.borderOpacity = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.borderOpacity = DEFAULT_SETTINGS.borderOpacity;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const slider = button.buttonEl.parentElement.parentElement.querySelector('input[type="range"]');
      if (slider) slider.value = DEFAULT_SETTINGS.borderOpacity;
    }));
    new import_obsidian2.Setting(containerEl).setName("Border Color").setDesc("Choose the color for the footer border").addColorPicker((color) => color.setValue(this.plugin.settings.borderColor.startsWith("var(--") ? (() => {
      const temp = document.createElement("div");
      temp.style.borderColor = "var(--text-accent)";
      document.body.appendChild(temp);
      const color2 = getComputedStyle(temp).borderColor;
      document.body.removeChild(temp);
      const rgb = color2.match(/\d+/g);
      if (rgb) {
        return "#" + rgb.map((x) => parseInt(x).toString(16).padStart(2, "0")).join("");
      }
      return "#000000";
    })() : this.plugin.settings.borderColor).onChange(async (value) => {
      this.plugin.settings.borderColor = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.borderColor = "var(--text-accent)";
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const colorPicker = button.buttonEl.parentElement.parentElement.querySelector('input[type="color"]');
      if (colorPicker) {
        const temp = document.createElement("div");
        temp.style.borderColor = "var(--text-accent)";
        document.body.appendChild(temp);
        const color = getComputedStyle(temp).borderColor;
        document.body.removeChild(temp);
        const rgb = color.match(/\d+/g);
        if (rgb && colorPicker) {
          colorPicker.value = "#" + rgb.map((x) => parseInt(x).toString(16).padStart(2, "0")).join("");
        }
      }
    }));
    new import_obsidian2.Setting(containerEl).setName("Link Border Radius").setDesc("Adjust the border radius of Backlinks and Outlinks (0-15px)").addSlider((slider) => slider.setLimits(0, 15, 1).setValue(this.plugin.settings.borderRadius).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.borderRadius = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.borderRadius = DEFAULT_SETTINGS.borderRadius;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const slider = button.buttonEl.parentElement.parentElement.querySelector('input[type="range"]');
      if (slider) slider.value = DEFAULT_SETTINGS.borderRadius;
    }));
    new import_obsidian2.Setting(containerEl).setName("Links Opacity").setDesc("Adjust the opacity of Backlinks and Outlinks (0-1)").addSlider((slider) => slider.setLimits(0, 1, 0.1).setValue(this.plugin.settings.linksOpacity).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.linksOpacity = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.linksOpacity = DEFAULT_SETTINGS.linksOpacity;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const slider = button.buttonEl.parentElement.parentElement.querySelector('input[type="range"]');
      if (slider) slider.value = DEFAULT_SETTINGS.linksOpacity;
    }));
    new import_obsidian2.Setting(containerEl).setName("Link Text Color").setDesc("Choose the color for link text").addColorPicker((color) => color.setValue(this.plugin.settings.linkColor.startsWith("var(--") ? (() => {
      const temp = document.createElement("div");
      temp.style.color = "var(--link-color)";
      document.body.appendChild(temp);
      const color2 = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      return rgbToHex(color2);
    })() : this.plugin.settings.linkColor).onChange(async (value) => {
      this.plugin.settings.linkColor = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.linkColor = "var(--link-color)";
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const colorPicker = button.buttonEl.parentElement.parentElement.querySelector('input[type="color"]');
      if (colorPicker) {
        const temp = document.createElement("div");
        temp.style.color = "var(--link-color)";
        document.body.appendChild(temp);
        const color = getComputedStyle(temp).color;
        document.body.removeChild(temp);
        const rgb = color.match(/\d+/g);
        if (rgb && colorPicker) {
          colorPicker.value = "#" + rgb.map((x) => parseInt(x).toString(16).padStart(2, "0")).join("");
        }
      }
    }));
    new import_obsidian2.Setting(containerEl).setName("Link Background Color").setDesc("Choose the background color for links").addColorPicker((color) => color.setValue(this.plugin.settings.linkBackgroundColor.startsWith("var(--") ? (() => {
      const temp = document.createElement("div");
      temp.style.backgroundColor = "var(--background-primary)";
      document.body.appendChild(temp);
      const bgColor = getComputedStyle(temp).backgroundColor;
      temp.style.backgroundColor = "var(--tag-background)";
      const tagColor = getComputedStyle(temp).backgroundColor;
      document.body.removeChild(temp);
      const blendedColor = blendRgbaWithBackground(tagColor, bgColor);
      return blendedColor ? rgbToHex(blendedColor) : "#000000";
    })() : this.plugin.settings.linkBackgroundColor).onChange(async (value) => {
      this.plugin.settings.linkBackgroundColor = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.linkBackgroundColor = "var(--tag-background)";
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const colorPicker = button.buttonEl.parentElement.parentElement.querySelector('input[type="color"]');
      if (colorPicker) {
        const temp = document.createElement("div");
        temp.style.backgroundColor = "var(--background-primary)";
        document.body.appendChild(temp);
        const bgColor = getComputedStyle(temp).backgroundColor;
        temp.style.backgroundColor = "var(--tag-background)";
        const tagColor = getComputedStyle(temp).backgroundColor;
        document.body.removeChild(temp);
        const blendedColor = blendRgbaWithBackground(tagColor, bgColor);
        if (blendedColor) {
          colorPicker.value = rgbToHex(blendedColor);
        }
      }
    }));
    new import_obsidian2.Setting(containerEl).setName("Link Border Color").setDesc("Choose the border color for links").addColorPicker((color) => color.setValue(this.plugin.settings.linkBorderColor.startsWith("rgba(255, 255, 255,") ? (() => {
      const temp = document.createElement("div");
      temp.style.backgroundColor = "var(--background-primary)";
      document.body.appendChild(temp);
      const bgColor = getComputedStyle(temp).backgroundColor;
      const blendedColor = blendRgbaWithBackground("rgba(255, 255, 255, 0.204)", bgColor);
      document.body.removeChild(temp);
      return blendedColor ? rgbToHex(blendedColor) : "#000000";
    })() : this.plugin.settings.linkBorderColor).onChange(async (value) => {
      this.plugin.settings.linkBorderColor = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.linkBorderColor = "rgba(255, 255, 255, 0.204)";
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const colorPicker = button.buttonEl.parentElement.parentElement.querySelector('input[type="color"]');
      if (colorPicker) {
        const temp = document.createElement("div");
        temp.style.backgroundColor = "var(--background-primary)";
        document.body.appendChild(temp);
        const bgColor = getComputedStyle(temp).backgroundColor;
        const blendedColor = blendRgbaWithBackground("rgba(255, 255, 255, 0.204)", bgColor);
        document.body.removeChild(temp);
        if (blendedColor) {
          colorPicker.value = rgbToHex(blendedColor);
        }
      }
    }));
    new import_obsidian2.Setting(containerEl).setName("Dates Opacity").setDesc("Adjust the opacity of the Created / Modified Dates (0-1)").addSlider((slider) => slider.setLimits(0, 1, 0.1).setValue(this.plugin.settings.datesOpacity).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.datesOpacity = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.datesOpacity = DEFAULT_SETTINGS.datesOpacity;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const slider = button.buttonEl.parentElement.parentElement.querySelector('input[type="range"]');
      if (slider) slider.value = DEFAULT_SETTINGS.datesOpacity;
    }));
    new import_obsidian2.Setting(containerEl).setName("Date Color").setDesc("Choose the color for Created / Modified Dates").addColorPicker((color) => color.setValue(this.plugin.settings.dateColor.startsWith("var(--") ? (() => {
      const temp = document.createElement("div");
      temp.style.color = "var(--text-accent)";
      document.body.appendChild(temp);
      const color2 = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      return rgbToHex(color2);
    })() : this.plugin.settings.dateColor).onChange(async (value) => {
      this.plugin.settings.dateColor = value;
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
    })).addButton((button) => button.setButtonText("Reset").onClick(async () => {
      this.plugin.settings.dateColor = "var(--text-accent)";
      await this.plugin.saveSettings();
      this.plugin.updateRichFoot();
      const colorPicker = button.buttonEl.parentElement.parentElement.querySelector('input[type="color"]');
      if (colorPicker) {
        const temp = document.createElement("div");
        temp.style.color = "var(--text-accent)";
        document.body.appendChild(temp);
        const color = getComputedStyle(temp).color;
        document.body.removeChild(temp);
        colorPicker.value = rgbToHex(color);
      }
    }));
    containerEl.createEl("h3", { text: "Example Screenshot", cls: "rich-foot-example-title" });
    const exampleDiv = containerEl.createDiv({ cls: "rich-foot-example" });
    const img = exampleDiv.createEl("img", {
      attr: {
        src: "https://raw.githubusercontent.com/jparkerweb/rich-foot/refs/heads/main/rich-foot.jpg",
        alt: "Rich Foot Example"
      }
    });
    new import_obsidian2.Setting(containerEl).setName("Show Release Notes").setDesc("Show release notes after plugin updates").addToggle((toggle) => toggle.setValue(this.plugin.settings.showReleaseNotes).onChange(async (value) => {
      this.plugin.settings.showReleaseNotes = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian2.Setting(containerEl).setName("Show Release Notes").setDesc("View release notes for the current version").addButton((button) => button.setButtonText("Show Release Notes").onClick(async () => {
      const notes = await this.plugin.getReleaseNotes(this.plugin.manifest.version);
      new ReleaseNotesModal(this.app, this.plugin, this.plugin.manifest.version, notes).open();
    }));
  }
  async browseForFolder() {
    const folders = this.app.vault.getAllLoadedFiles().filter((file) => file.children).map((folder) => folder.path);
    return new Promise((resolve) => {
      const modal = new FolderSuggestModal(this.app, folders, (result) => {
        resolve(result);
      });
      modal.open();
    });
  }
};
var FolderSuggestModal = class extends import_obsidian2.FuzzySuggestModal {
  constructor(app, folders, onChoose) {
    super(app);
    this.folders = folders;
    this.onChoose = onChoose;
  }
  getItems() {
    return this.folders;
  }
  getItemText(item) {
    return item;
  }
  onChooseItem(item, evt) {
    this.onChoose(item);
  }
};
var main_default = RichFootPlugin;

/* nosourcemap */