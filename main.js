document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 元素获取与状态管理 ---
    const fileListElement = document.getElementById('file-list');
    const contentAreaElement = document.getElementById('content-area');
    const toggleBtn = document.getElementById('toggle-btn');
    const themeSelector = document.getElementById('theme-selector');
    const body = document.body;
    const markdownThemeLink = document.getElementById('markdown-theme-style');
    const tocContainer = document.getElementById('toc-container');
    const tocList = document.getElementById('toc-list');
    
    const docsPath = 'docs/';
    let currentFile = null; // 存储当前加载的文件名
    let currentActiveFileLink = null; // 存储当前高亮的文件链接
    let tocObserver = null;

    // --- 2. 路由核心 ---
    function parseHash() {
        const hash = window.location.hash.slice(1); // 移除开头的 #
        if (!hash.startsWith('/')) {
            return { file: null, anchor: null };
        }
        const [file, anchor] = hash.slice(1).split('#'); // 移除开头的 /
        return { file: file || null, anchor: anchor || null };
    }

    async function handleRoute() {
        const { file, anchor } = parseHash();

        // 如果 URL 中的文件与当前文件不同，则加载新文件
        if (file && file !== currentFile) {
            await loadMarkdownFile(file);
        } else if (!file) {
            // 如果 URL 中没有文件，显示欢迎信息
            contentAreaElement.innerHTML = `<h2>欢迎！</h2><p>请从左侧选择一个文档进行查看。</p>`;
            currentFile = null;
            updateToc(); // 清空TOC
        }

        // 更新左侧文件列表的高亮状态
        updateActiveFileLink(file);

        // 如果有锚点，滚动到对应位置
        if (anchor) {
            // 使用小延迟确保 DOM 更新完毕
            setTimeout(() => {
                const element = document.getElementById(anchor);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }

    // --- 3. UI 设置与事件处理 (已修改为更新 Hash) ---
    function setupSidebarToggle() { /* ... 无变化 ... */ toggleBtn.addEventListener('click', () => body.classList.toggle('sidebar-collapsed')); }
    function setupThemeControls() { /* ... 无变化 ... */
        const themeCssUrls = { system: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown.min.css', light: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-light.min.css', dark: 'https://cdn.jsdelivr.net/npm/github-markdown-css@5.5.1/github-markdown-dark.min.css' };
        function applyTheme(selectedTheme) { let uiTheme = selectedTheme; if (uiTheme === 'system') { uiTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } document.documentElement.setAttribute('data-theme', uiTheme); const newHref = themeCssUrls[selectedTheme]; if (markdownThemeLink.getAttribute('href') !== newHref) { markdownThemeLink.setAttribute('href', newHref); } }
        themeSelector.addEventListener('change', () => { const t = themeSelector.value; localStorage.setItem('theme', t); applyTheme(t); });
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if ((localStorage.getItem('theme') || 'system') === 'system') { applyTheme('system'); } });
        const initialTheme = localStorage.getItem('theme') || 'system'; themeSelector.value = initialTheme; applyTheme(initialTheme);
    }

    function setupToc() {
        tocList.addEventListener('click', (event) => {
            event.preventDefault();
            const target = event.target.closest('a');
            if (target && currentFile) {
                const anchor = target.getAttribute('href'); // e.g., #my-section
                window.location.hash = `/${currentFile}${anchor}`;
            }
        });
    }

    function setupFileLoading() {
        fileListElement.addEventListener('click', (event) => {
            event.preventDefault();
            const target = event.target.closest('a');
            if (target) {
                const filename = target.dataset.filename;
                window.location.hash = `/${filename}`;
            }
        });
    }

    // 新增：处理内容区内部的锚点链接
    function setupContentLinkNavigation() {
        contentAreaElement.addEventListener('click', (event) => {
            const target = event.target.closest('a');
            if (target && currentFile) {
                const href = target.getAttribute('href');
                // 只处理内部锚点链接
                if (href && href.startsWith('#')) {
                    event.preventDefault();
                    window.location.hash = `/${currentFile}${href}`;
                }
            }
        });
    }

    // --- 4. 核心功能函数 ---
    function updateActiveFileLink(filename) {
        if (currentActiveFileLink) {
            currentActiveFileLink.classList.remove('active');
        }
        if (filename) {
            const newActiveLink = fileListElement.querySelector(`a[data-filename="${filename}"]`);
            if (newActiveLink) {
                newActiveLink.classList.add('active');
                currentActiveFileLink = newActiveLink;
            }
        }
    }

    async function loadMarkdownFile(filename) {
        try {
            const response = await fetch(`${docsPath}${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const markdownText = await response.text();
            contentAreaElement.innerHTML = marked.parse(markdownText);
            currentFile = filename; // 更新当前文件状态
            updateToc(); // 渲染完成后更新 TOC
        } catch (error) {
            console.error(`无法加载文件 ${filename}:`, error);
            contentAreaElement.innerHTML = `<p style="color: red;">错误：无法加载文件 ${filename}。</p>`;
            currentFile = null;
        }
    }

    function updateToc() { /* ... 无变化 ... */
        tocList.innerHTML = '';
        if (tocObserver) { tocObserver.disconnect(); }
        const headings = contentAreaElement.querySelectorAll('h1, h2, h3');
        if (headings.length === 0) { tocContainer.style.display = 'none'; return; }
        tocContainer.style.display = 'flex';
        const headingElements = [];
        headings.forEach((heading, index) => {
            const text = heading.textContent;
            let id = text.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
            if (!id) id = `heading-${index}`;
            heading.id = id;
            headingElements.push(heading);
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = text;
            link.classList.add('toc-link', `toc-${heading.tagName.toLowerCase()}`);
            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });
        const observerOptions = { rootMargin: '0px 0px -80% 0px' };
        tocObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
                if (entry.isIntersecting && link) {
                    tocList.querySelectorAll('.active').forEach(activeLink => activeLink.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        }, observerOptions);
        headingElements.forEach(h => tocObserver.observe(h));
    }

    async function populateFileList() { /* ... 无变化 ... */
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

    // --- 5. 初始化 ---
    async function initialize() {
        setupSidebarToggle();
        setupThemeControls();
        setupToc();
        setupFileLoading();
        setupContentLinkNavigation(); // 新增

        await populateFileList(); // 确保文件列表先加载

        // 监听 hash 变化
        window.addEventListener('hashchange', handleRoute);
        // 处理初始 URL
        handleRoute();
    }

    initialize();
});