document.addEventListener("DOMContentLoaded", () => {
    const fileListElement = document.getElementById("file-list");
    const contentAreaElement = document.getElementById("content-area");
    const toggleBtn = document.getElementById("toggle-btn");
    const themeSelector = document.getElementById("theme-selector");
    const body = document.body;
    const markdownThemeLink = document.getElementById("markdown-theme-style");
    const tocContainer = document.getElementById("toc-container");
    const tocList = document.getElementById("toc-list");
    const docsPath = "articles/";
    let currentFile = null;
    let currentActiveFileLink = null;
    let tocObserver = null;

    function parseHash() {
        const hash = window.location.hash.slice(1);
        if (!hash.startsWith("/")) {
            return {file: null, anchor: null};
        }
        const [file, anchor] = hash.slice(1).split("#");
        return {file: file || null, anchor: anchor || null};
    }
    async function handleRoute() {
        const {file, anchor} = parseHash();
        if (file && file !== currentFile) {
            await loadMarkdownFile(file);
        } else if (!file) {
            contentAreaElement.innerHTML = `<h2>欢迎！</h2><p>请从左侧选择一个文档进行查看。</p>`;
            currentFile = null;
            updateToc();
        }
        updateActiveFileLink(file);
        if (anchor) {
            setTimeout(() => {
                const element = document.getElementById(anchor);
                if (element) {
                    element.scrollIntoView({behavior: "smooth", block: "start"});
                }
            }, 100);
        }
    }

    function setupSidebarToggle() {
        toggleBtn.addEventListener("click", () => body.classList.toggle("sidebar-collapsed"));
    }
    function setupThemeControls() {
        const themeCssUrls = {system: "css/github-markdown.css", light: "css/github-markdown-light.css", dark: "css/github-markdown-dark.css"};
        function applyTheme(selectedTheme) {
            let uiTheme = selectedTheme;
            if (uiTheme === "system") {
                uiTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            document.documentElement.setAttribute("data-theme", uiTheme);
            const newHref = themeCssUrls[selectedTheme];
            if (markdownThemeLink.getAttribute("href") !== newHref) {
                markdownThemeLink.setAttribute("href", newHref);
            }
        }
        themeSelector.addEventListener("change", () => {
            const t = themeSelector.value;
            localStorage.setItem("theme", t);
            applyTheme(t);
        });
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
            if ((localStorage.getItem("theme") || "system") === "system") {
                applyTheme("system");
            }
        });
        const initialTheme = localStorage.getItem("theme") || "system";
        themeSelector.value = initialTheme;
        applyTheme(initialTheme);
    }
    function setupToc() {
        tocList.addEventListener("click", (event) => {
            event.preventDefault();
            const target = event.target.closest("a");
            if (target && currentFile) {
                const anchor = target.getAttribute("href");
                window.location.hash = `/${currentFile}${anchor}`;
            }
        });
    }
    function setupFileLoading() {
        fileListElement.addEventListener("click", (event) => {
            const target = event.target.closest("a");

            // 关键改动：仅当点击的是一个带有 data-filename 属性的文件链接时，才阻止默认行为。
            // 这样就不会影响 <summary> 标签（文件夹）的展开/收起功能。
            if (target && target.dataset.filename) {
                event.preventDefault();
                const filename = target.dataset.filename;
                window.location.hash = `/${filename}`;
            }
        });
    }
    function setupContentLinkNavigation() {
        contentAreaElement.addEventListener("click", (event) => {
            const target = event.target.closest("a");
            if (target && currentFile) {
                const href = target.getAttribute("href");
                if (href && href.startsWith("#")) {
                    event.preventDefault();
                    window.location.hash = `/${currentFile}${href}`;
                }
            }
        });
    }

    // --- 核心功能函数 (populateFileList) ---
    function updateActiveFileLink(filename) {
        // 移除旧的 active 状态
        if (currentActiveFileLink) {
            currentActiveFileLink.classList.remove("active");
        }

        if (filename) {
            const newActiveLink = fileListElement.querySelector(`a[data-filename="${decodeURIComponent(filename)}"]`);
            if (newActiveLink) {
                newActiveLink.classList.add("active");
                currentActiveFileLink = newActiveLink;

                let parent = newActiveLink.parentElement;
                while (parent && parent !== fileListElement) {
                    // 如果父元素是一个 <details> 标签，就将其展开
                    if (parent.tagName === "DETAILS") {
                        parent.open = true;
                    }
                    parent = parent.parentElement;
                }
            }
        }
    }
    async function loadMarkdownFile(filename) {
        try {
            const response = await fetch(`${docsPath}${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const markdownText = await response.text();
            contentAreaElement.innerHTML = marked.parse(markdownText);
            currentFile = filename;
            updateToc();
        } catch (error) {
            console.error(`无法加载文件 ${filename}:`, error);
            contentAreaElement.innerHTML = `<p style="color: red;">错误：无法加载文件 ${filename}。</p>`;
            currentFile = null;
        }
    }
    function updateToc() {
        tocList.innerHTML = "";
        if (tocObserver) {
            tocObserver.disconnect();
        }
        const headings = contentAreaElement.querySelectorAll("h1, h2, h3");
        if (headings.length === 0) {
            tocContainer.style.display = "none";
            return;
        }
        tocContainer.style.display = "flex";
        const headingElements = [];
        headings.forEach((heading, index) => {
            const text = heading.textContent;
            let id = text
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^\w-]+/g, "");
            if (!id) id = `heading-${index}`;
            heading.id = id;
            headingElements.push(heading);
            const listItem = document.createElement("li");
            const link = document.createElement("a");
            link.href = `#${id}`;
            link.textContent = text;
            link.classList.add("toc-link", `toc-${heading.tagName.toLowerCase()}`);
            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });
        const observerOptions = {rootMargin: "0px 0px -80% 0px"};
        tocObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
                if (entry.isIntersecting && link) {
                    tocList.querySelectorAll(".active").forEach((activeLink) => activeLink.classList.remove("active"));
                    link.classList.add("active");
                }
            });
        }, observerOptions);
        headingElements.forEach((h) => tocObserver.observe(h));
    }

    /**
     * 递归地探索目录并构建文件树。
     * @param {string} path - 当前要扫描的相对路径。
     * @param {HTMLElement} containerElement - 用于附加文件/目录项的父元素。
     */
    async function buildFileTree(path, containerElement) {
        try {
            const response = await fetch(`${docsPath}${path}`);
            if (!response.ok) throw new Error(`HTTP 错误: ${response.status}`);
            const items = await response.json();

            items.sort((a, b) => {
                const aIsDir = a.type === "directory";
                const bIsDir = b.type === "directory";
                if (aIsDir && !bIsDir) return -1;
                if (!aIsDir && bIsDir) return 1;
                return a.name.localeCompare(b.name, "zh-CN");
            });

            containerElement.innerHTML = "";

            for (const item of items) {
                if (item.name.startsWith(".")) continue;

                const fullPath = `${path}${item.name}`;

                if (item.type === "directory") {
                    const details = document.createElement("details");
                    const summary = document.createElement("summary");
                    summary.textContent = item.name;
                    const subList = document.createElement("ul");
                    details.appendChild(summary);
                    details.appendChild(subList);
                    containerElement.appendChild(details);
                    await buildFileTree(`${fullPath}/`, subList);
                } else if (item.name.endsWith(".md")) {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = "#";
                    a.textContent = item.name.replace(".md", "");
                    a.dataset.filename = fullPath;
                    li.appendChild(a);
                    containerElement.appendChild(li);
                }
            }
        } catch (error) {
            console.error(`无法加载目录 '${path}':`, error);
            containerElement.innerHTML = `<li>加载 '${path}' 失败</li>`;
        }
    }

    // populateFileList 现在是递归树构建的入口点
    async function populateFileList() {
        fileListElement.innerHTML = "<li>加载中...</li>";
        try {
            await buildFileTree("", fileListElement);
            // 移除加载指示器
            const loadingLi = fileListElement.querySelector("li");
            if (loadingLi && loadingLi.textContent === "加载中...") {
                fileListElement.removeChild(loadingLi);
            }
        } catch (error) {
            fileListElement.innerHTML = "<li>加载文件列表失败。</li>";
            console.error("构建文件树失败:", error);
        }
    }

    async function initialize() {
        setupSidebarToggle();
        setupThemeControls();
        setupToc();
        setupFileLoading();
        setupContentLinkNavigation();
        await populateFileList();
        window.addEventListener("hashchange", handleRoute);
        handleRoute();
    }

    initialize();
});
