document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取 ---
    const fileListElement = document.getElementById('file-list');
    const contentAreaElement = document.getElementById('content-area');
    const toggleBtn = document.getElementById('toggle-btn');
    const themeSelector = document.getElementById('theme-selector');
    const body = document.body;
    const markdownThemeLink = document.getElementById('markdown-theme-style');
    // 新增：TOC 相关元素
    const tocContainer = document.getElementById('toc-container');
    const tocList = document.getElementById('toc-list');
    const toggleTocBtn = document.getElementById('toggle-toc-btn');

    const docsPath = 'docs/';
    let currentActiveLink = null;
    let tocObserver = null; // 用于存储 IntersectionObserver 实例

    // --- 侧边栏收起/展开逻辑 ---
    function setupSidebarToggle() {
        toggleBtn.addEventListener('click', () => {
            body.classList.toggle('sidebar-collapsed');
        });
    }

    // --- 主题管理逻辑 (无变化) ---
    const themeCssUrls = { system: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css', light: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-light.min.css', dark: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-dark.min.css' };
    function applyTheme(selectedTheme) {
        let uiTheme = selectedTheme;
        if (uiTheme === 'system') { uiTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
        document.documentElement.setAttribute('data-theme', uiTheme);
        const newHref = themeCssUrls[selectedTheme];
        if (markdownThemeLink.getAttribute('href') !== newHref) { markdownThemeLink.setAttribute('href', newHref); }
    }
    function setupThemeControls() {
        themeSelector.addEventListener('change', () => { const t = themeSelector.value; localStorage.setItem('theme', t); applyTheme(t); });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if ((localStorage.getItem('theme') || 'system') === 'system') { applyTheme('system'); } });
        const initialTheme = localStorage.getItem('theme') || 'system';
        themeSelector.value = initialTheme;
        applyTheme(initialTheme);
    }

    // --- 新增：TOC 逻辑 ---
    function setupToc() {
        // TOC 折叠功能
        toggleTocBtn.addEventListener('click', () => {
            tocContainer.classList.toggle('toc-collapsed');
        });

        // TOC 链接点击平滑滚动
        tocList.addEventListener('click', (event) => {
            event.preventDefault();
            const target = event.target.closest('a');
            if (target) {
                const targetId = target.getAttribute('href');
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    function updateToc() {
        // 清理旧的 TOC 和 Observer
        tocList.innerHTML = '';
        if (tocObserver) {
            tocObserver.disconnect();
        }

        const headings = contentAreaElement.querySelectorAll('h1, h2, h3');
        if (headings.length === 0) {
            tocContainer.style.display = 'none';
            return;
        }
        tocContainer.style.display = 'flex';

        const headingElements = [];

        headings.forEach((heading, index) => {
            // 1. 为标题生成并注入 ID
            const text = heading.textContent;
            let id = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            if (!id) id = `heading-${index}`;
            heading.id = id;
            headingElements.push(heading);

            // 2. 创建 TOC 列表项
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = text;
            link.classList.add('toc-link', `toc-${heading.tagName.toLowerCase()}`);
            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });

        // 3. 设置 IntersectionObserver 监听标题可见性
        const observerOptions = { rootMargin: '0px 0px -80% 0px' }; // 当标题进入视口顶部 20% 时触发
        tocObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
                if (entry.isIntersecting) {
                    // 移除所有 active 类，再为当前项添加
                    tocList.querySelectorAll('.active').forEach(activeLink => activeLink.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        }, observerOptions);

        headingElements.forEach(h => tocObserver.observe(h));
    }

    // --- 文档加载逻辑 (修改) ---
    async function loadMarkdownFile(filename) {
        try {
            const response = await fetch(`${docsPath}${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const markdownText = await response.text();
            contentAreaElement.innerHTML = marked.parse(markdownText);
            // 新增：渲染完成后更新 TOC
            updateToc();
        } catch (error) {
            console.error(`无法加载文件 ${filename}:`, error);
            contentAreaElement.innerHTML = `<p style="color: red;">错误：无法加载文件 ${filename}。</p>`;
        }
    }

    // (populateFileList 和 setupFileLoading 保持不变)
    async function populateFileList() {
        try {
            const response = await fetch(docsPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const files = await response.json();
            fileListElement.innerHTML = '';
            files.filter(f => f.name.endsWith('.md')).forEach(f => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.textContent = f.name.replace('.md', '');
                a.dataset.filename = f.name;
                li.appendChild(a);
                fileListElement.appendChild(li);
            });
        } catch (error) { console.error('无法获取文件列表:', error); contentAreaElement.innerHTML = `<p style="color: red;">错误：无法加载文档列表。</p>`; }
    }
    function setupFileLoading() {
        fileListElement.addEventListener('click', (event) => {
            event.preventDefault();
            const target = event.target;
            if (target.tagName === 'A') {
                const filename = target.dataset.filename;
                if (filename) {
                    if (currentActiveLink) { currentActiveLink.classList.remove('active'); }
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
        setupToc(); // 新增
        populateFileList();
        setupFileLoading();
    }

    initialize();
});