document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取 ---
    const fileListElement = document.getElementById('file-list');
    const contentAreaElement = document.getElementById('content-area');
    const toggleBtn = document.getElementById('toggle-btn');
    const themeSelector = document.getElementById('theme-selector');
    const body = document.body;
    // 新增：获取 markdown 主题 link 元素的引用
    const markdownThemeLink = document.getElementById('markdown-theme-style');
    const docsPath = 'docs/';
    let currentActiveLink = null;

    // --- 侧边栏收起/展开逻辑 ---
    function setupSidebarToggle() {
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('sidebar-collapsed');
        });
    }

    // --- 主题管理逻辑 (已重构为动态加载 CSS) ---
    const themeCssUrls = {
        system: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css',
        light: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-light.min.css',
        dark: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-dark.min.css'
    };

    function applyTheme(selectedTheme) {
        // 1. 更新我们自定义界面的主题 (侧边栏等)
        let uiTheme = selectedTheme;
        if (uiTheme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            uiTheme = systemPrefersDark ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', uiTheme);

        // 2. 更新 Markdown 内容区域的主题 (通过切换 CSS 文件)
        const newHref = themeCssUrls[selectedTheme];
        if (markdownThemeLink.getAttribute('href') !== newHref) {
            markdownThemeLink.setAttribute('href', newHref);
        }
    }

    function setupThemeControls() {
        themeSelector.addEventListener('change', () => {
            const selectedTheme = themeSelector.value;
            localStorage.setItem('theme', selectedTheme);
            applyTheme(selectedTheme);
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const storedTheme = localStorage.getItem('theme') || 'system';
            if (storedTheme === 'system') {
                applyTheme('system');
            }
        });

        const initialTheme = localStorage.getItem('theme') || 'system';
        themeSelector.value = initialTheme;
        applyTheme(initialTheme);
    }

    // --- 文档加载逻辑 (保持不变) ---
    async function populateFileList() {
        try {
            const response = await fetch(docsPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const files = await response.json();
            fileListElement.innerHTML = '';
            files
                .filter(file => file.name.endsWith('.md'))
                .forEach(file => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = '#';
                    link.textContent = file.name.replace('.md', '');
                    link.dataset.filename = file.name;
                    listItem.appendChild(link);
                    fileListElement.appendChild(listItem);
                });
        } catch (error) {
            console.error('无法获取文件列表:', error);
            contentAreaElement.innerHTML = `<p style="color: red;">错误：无法加载文档列表。请检查 Nginx 配置和网络连接。</p>`;
        }
    }

    async function loadMarkdownFile(filename) {
        try {
            const response = await fetch(`${docsPath}${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const markdownText = await response.text();
            contentAreaElement.innerHTML = marked.parse(markdownText);
        } catch (error) {
            console.error(`无法加载文件 ${filename}:`, error);
            contentAreaElement.innerHTML = `<p style="color: red;">错误：无法加载文件 ${filename}。</p>`;
        }
    }

    function setupFileLoading() {
        fileListElement.addEventListener('click', (event) => {
            event.preventDefault();
            const target = event.target;
            if (target.tagName === 'A') {
                const filename = target.dataset.filename;
                if (filename) {
                    if (currentActiveLink) {
                        currentActiveLink.classList.remove('active');
                    }
                    target.classList.add('active');
                    currentActiveLink = target;
                    loadMarkdownFile(filename);
                }
            }
        });
    }

    // --- 初始化 ---
    function initialize() {
        setupSidebarToggle();
        setupThemeControls();
        populateFileList();
        setupFileLoading();
    }

    initialize();
});