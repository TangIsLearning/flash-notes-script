// ==UserScript==
// @name         网页闪念笔记(完整版)
// @namespace    https://github.com/yourname
// @version      2.0
// @description  支持跨页面查看和管理的闪念笔记工具
// @author       You
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_log
// @grant        GM_notification
// @grant        GM_openInTab
// ==/UserScript==

(function() {
    'use strict';

    // 调试日志函数
    function debugLog(message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[FlashNote][${timestamp}] ${message}`;
        console.log(logMessage, data || '');
    }

    debugLog('脚本开始执行');

    // 笔记数据结构
    const STORAGE_KEY = 'FLASH_NOTES_v2';
    let allNotes = {};

    try {
        allNotes = GM_getValue(STORAGE_KEY, {});
        debugLog('从存储加载的所有笔记数据:', allNotes);
    } catch (e) {
        debugLog('读取存储数据时出错:', e);
        allNotes = {};
    }

    // 添加全局样式
    GM_addStyle(`
        .flash-note-container {
            position: fixed;
            right: 20px;
            bottom: 20px;
            width: 350px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 20px rgba(0,0,0,0.15);
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            overflow: hidden;
            max-height: 70vh;
            display: flex;
            flex-direction: column;
            resize: both;
            min-width: 300px;
            min-height: 200px;
        }

        .flash-note-header {
            padding: 12px 16px;
            background: #1e80ff;
            color: white;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
        }

        .flash-note-close {
            cursor: pointer;
            font-size: 18px;
            margin-left: 10px;
        }

        .flash-note-tabs {
            display: flex;
            border-bottom: 1px solid #f0f0f0;
            overflow-x: auto;
            background: #f9f9f9;
        }

        .flash-note-tab {
            padding: 8px 16px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            white-space: nowrap;
            font-size: 13px;
        }

        .flash-note-tab.active {
            border-bottom-color: #1e80ff;
            color: #1e80ff;
            font-weight: 500;
        }

        .flash-note-filter {
            padding: 10px 16px;
            border-bottom: 1px solid #f0f0f0;
            background: #f9f9f9;
        }

        .flash-note-filter input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
        }

        .flash-note-content {
            padding: 0;
            overflow-y: auto;
            flex-grow: 1;
        }

        .flash-note-item {
            padding: 12px 16px;
            border-bottom: 1px solid #f0f0f0;
        }

        .flash-note-item:hover {
            background-color: #fafafa;
        }

        .flash-note-text {
            margin-bottom: 6px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .flash-note-source {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
        }

        .flash-note-source a {
            color: #1e80ff;
            text-decoration: none;
        }

        .flash-note-source a:hover {
            text-decoration: underline;
        }

        .flash-note-meta {
            font-size: 12px;
            color: #999;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .flash-note-actions {
            display: flex;
            gap: 10px;
        }

        .flash-note-action {
            cursor: pointer;
            color: #666;
        }

        .flash-note-action:hover {
            color: #1e80ff;
        }

        .flash-note-delete {
            color: #f56c6c;
        }

        .flash-note-delete:hover {
            color: #f00;
        }

        .flash-note-add {
            padding: 16px;
            border-top: 1px solid #f0f0f0;
            background: #f9f9f9;
        }

        .flash-note-textarea {
            width: 100%;
            min-height: 60px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 10px;
            resize: vertical;
            font-family: inherit;
            font-size: 13px;
        }

        .flash-note-save {
            background: #1e80ff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            width: 100%;
        }

        .flash-note-save:hover {
            background: #0d6efd;
        }

        .flash-note-highlight {
            background-color: rgba(255, 212, 0, 0.3);
            padding: 0 2px;
            border-radius: 2px;
        }

        .flash-note-btn {
            position: absolute;
            background: #1e80ff;
            color: white;
            border: none;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            z-index: 99998;
            display: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .flash-note-btn:hover {
            background: #0d6efd;
        }

        .flash-note-empty {
            color: #999;
            text-align: center;
            padding: 40px 20px;
            font-size: 14px;
        }

        .flash-note-resize-handle {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 15px;
            height: 15px;
            cursor: nwse-resize;
        }

        .flash-note-export-btn {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 12px;
            margin-right: 10px;
        }

        .flash-note-export-btn:hover {
            color: #1e80ff;
        }
    `);

    // 创建主容器
    const container = document.createElement('div');
    container.className = 'flash-note-container';
    container.style.display = 'none';

    // 创建标题栏
    const header = document.createElement('div');
    header.className = 'flash-note-header';
    header.innerHTML = `
        <span>闪念笔记</span>
        <div>
            <button class="flash-note-export-btn" title="导出笔记">导出</button>
            <span class="flash-note-close" title="关闭">×</span>
        </div>
    `;

    // 创建标签页区域
    const tabs = document.createElement('div');
    tabs.className = 'flash-note-tabs';

    // 创建过滤区域
    const filter = document.createElement('div');
    filter.className = 'flash-note-filter';
    filter.innerHTML = `<input type="text" placeholder="搜索笔记内容..." id="flash-note-search">`;

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'flash-note-content';

    // 创建添加笔记区域
    const addNoteArea = document.createElement('div');
    addNoteArea.className = 'flash-note-add';
    addNoteArea.innerHTML = `
        <textarea class="flash-note-textarea" placeholder="记录你的闪念..."></textarea>
        <button class="flash-note-save">保存笔记</button>
    `;

    // 组装容器
    container.appendChild(header);
    container.appendChild(tabs);
    container.appendChild(filter);
    container.appendChild(content);
    container.appendChild(addNoteArea);
    document.body.appendChild(container);

    // 创建浮动添加按钮
    const addBtn = document.createElement('button');
    addBtn.className = 'flash-note-btn';
    addBtn.textContent = '添加闪念';
    document.body.appendChild(addBtn);

    // 当前显示的域名和搜索词
    let currentDomain = null;
    let currentSearch = '';

    // 初始化标签页
    function initTabs() {
        tabs.innerHTML = '';

        // 添加"全部"标签
        const allTab = document.createElement('div');
        allTab.className = `flash-note-tab ${!currentDomain ? 'active' : ''}`;
        allTab.textContent = '全部笔记';
        allTab.addEventListener('click', () => {
            currentDomain = null;
            refreshNotes();
            updateTabs();
        });
        tabs.appendChild(allTab);

        // 添加各域名标签
        const domains = Object.keys(allNotes).sort((a, b) => {
            // 当前网站的标签排在前面
            if (a === window.location.hostname) return -1;
            if (b === window.location.hostname) return 1;
            return a.localeCompare(b);
        });

        domains.forEach(domain => {
            const tab = document.createElement('div');
            tab.className = `flash-note-tab ${domain === currentDomain ? 'active' : ''}`;
            tab.textContent = domain;
            tab.title = `${allNotes[domain].length}条笔记`;
            tab.addEventListener('click', () => {
                currentDomain = domain;
                refreshNotes();
                updateTabs();
            });
            tabs.appendChild(tab);
        });
    }

    // 更新标签页状态
    function updateTabs() {
        Array.from(tabs.querySelectorAll('.flash-note-tab')).forEach(tab => {
            tab.classList.remove('active');
            if ((!currentDomain && tab.textContent === '全部笔记') ||
                (tab.textContent === currentDomain)) {
                tab.classList.add('active');
            }
        });
    }

    // 保存笔记到存储
    function saveNote(note) {
        const domain = window.location.hostname;

        if (!allNotes[domain]) {
            allNotes[domain] = [];
        }

        allNotes[domain].unshift(note); // 新的笔记放在前面

        try {
            GM_setValue(STORAGE_KEY, allNotes);
            debugLog('笔记保存成功', { domain, note });

            // 显示通知
            GM_notification({
                title: '闪念笔记已保存',
                text: '笔记已成功保存',
                timeout: 2000
            });

            // 如果当前显示的是该域名的笔记或全部笔记，则刷新
            if (!currentDomain || currentDomain === domain) {
                refreshNotes();
            }

            // 更新标签页
            if (!tabs.querySelector(`.flash-note-tab:not(.active)`)) {
                initTabs();
            }

            return true;
        } catch (e) {
            debugLog('存储笔记时出错:', e);
            GM_notification({
                title: '保存失败',
                text: '笔记保存失败: ' + e.message,
                timeout: 3000
            });
            return false;
        }
    }

    // 刷新笔记显示
    function refreshNotes() {
        debugLog('刷新笔记显示', { currentDomain, currentSearch });

        content.innerHTML = '';

        // 获取要显示的笔记
        let notesToShow = [];
        if (currentDomain) {
            notesToShow = [...(allNotes[currentDomain] || [])];
        } else {
            // 显示全部笔记
            Object.values(allNotes).forEach(domainNotes => {
                notesToShow.push(...domainNotes);
            });
            // 按时间倒序排序
            notesToShow.sort((a, b) => b.timestamp - a.timestamp);
        }

        // 应用搜索过滤
        if (currentSearch) {
            const searchLower = currentSearch.toLowerCase();
            notesToShow = notesToShow.filter(note =>
                note.text.toLowerCase().includes(searchLower) ||
                (note.pageTitle && note.pageTitle.toLowerCase().includes(searchLower)))
        }

        debugLog('将要显示的笔记数量:', notesToShow.length);

        if (notesToShow.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'flash-note-empty';
            emptyMsg.textContent = currentSearch ?
                '没有找到匹配的笔记' :
                (currentDomain ? '该网站暂无笔记' : '暂无任何笔记');
            content.appendChild(emptyMsg);
            return;
        }

        notesToShow.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'flash-note-item';

            const date = new Date(note.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString();

            const domain = note.domain || (note.url ? new URL(note.url).hostname : '未知来源');
            const pageTitle = note.pageTitle || '无标题';

            noteItem.innerHTML = `
                <div class="flash-note-text">${note.text}</div>
                <div class="flash-note-source">
                    <span>${pageTitle}</span>
                    ${note.url ? `<a href="${note.url}" target="_blank" title="前往来源页面">${domain}</a>` : `<span>${domain}</span>`}
                </div>
                <div class="flash-note-meta">
                    <span>${dateStr} ${timeStr}</span>
                    <div class="flash-note-actions">
                        ${note.url ? `<span class="flash-note-action" title="前往来源页面">↗</span>` : ''}
                        <span class="flash-note-action flash-note-delete" title="删除笔记">删除</span>
                    </div>
                </div>
            `;

            // 添加事件监听
            const deleteBtn = noteItem.querySelector('.flash-note-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteNote(note);
                });
            }

            const sourceLink = noteItem.querySelector('.flash-note-action:not(.flash-note-delete)');
            if (sourceLink && note.url) {
                sourceLink.addEventListener('click', (e) => {
                    e.stopPropagation();
                    GM_openInTab(note.url, { active: true });
                });
            }

            content.appendChild(noteItem);
        });
    }

    // 删除笔记
    function deleteNote(note) {
        const domain = note.domain || (note.url ? new URL(note.url).hostname : null);
        if (!domain || !allNotes[domain]) return;

        debugLog('删除笔记', { domain, note });

        // 找到笔记在数组中的位置
        const noteIndex = allNotes[domain].findIndex(
            n => n.timestamp === note.timestamp && n.text === note.text
        );

        if (noteIndex !== -1) {
            allNotes[domain].splice(noteIndex, 1);

            // 如果该域名没有笔记了，移除域名键
            if (allNotes[domain].length === 0) {
                delete allNotes[domain];
            }

            try {
                GM_setValue(STORAGE_KEY, allNotes);
                debugLog('笔记删除成功');
                GM_notification({
                    title: '笔记已删除',
                    text: '笔记已成功删除',
                    timeout: 2000
                });
                refreshNotes();
                initTabs(); // 更新标签页
            } catch (e) {
                debugLog('删除笔记后存储时出错:', e);
                GM_notification({
                    title: '删除失败',
                    text: '笔记删除失败: ' + e.message,
                    timeout: 3000
                });
            }
        }
    }

    // 导出笔记
    function exportNotes() {
        let exportContent = '# 闪念笔记导出\n\n';
        const exportDate = new Date().toLocaleString();

        exportContent += `导出时间: ${exportDate}\n`;
        exportContent += `笔记总数: ${Object.values(allNotes).reduce((sum, notes) => sum + notes.length, 0)}\n\n`;

        // 按域名组织导出内容
        Object.keys(allNotes).sort().forEach(domain => {
            exportContent += `## ${domain}\n\n`;

            allNotes[domain].forEach(note => {
                const date = new Date(note.timestamp).toLocaleString();
                exportContent += `### ${note.pageTitle || '无标题'}\n`;
                exportContent += `时间: ${date}\n`;
                if (note.url) exportContent += `[来源链接](${note.url})\n`;
                exportContent += `\n${note.text}\n\n`;
            });
        });

        // 创建Blob对象
        const blob = new Blob([exportContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `闪念笔记_${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();

        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    // 文本选中处理
    document.addEventListener('mouseup', (e) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (!selectedText || e.target.closest('.flash-note-container')) {
            addBtn.style.display = 'none';
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        addBtn.style.display = 'block';
        addBtn.style.left = (rect.left + window.scrollX + rect.width / 2 - 40) + 'px';
        addBtn.style.top = (rect.top + window.scrollY - 35) + 'px';

        // 点击添加按钮
        addBtn.onclick = () => {
            const newNote = {
                text: selectedText,
                url: window.location.href,
                domain: window.location.hostname,
                timestamp: new Date().getTime(),
                pageTitle: document.title,
                isHighlight: true,
                highlightText: selectedText
            };

            if (saveNote(newNote)) {
                addBtn.style.display = 'none';

                // 高亮选中的文本
                const span = document.createElement('span');
                span.className = 'flash-note-highlight';
                try {
                    range.surroundContents(span);
                    debugLog('文本高亮成功');
                } catch (e) {
                    debugLog('文本高亮失败:', e);
                }
            }
        };
    });

    // 拖拽功能
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('flash-note-close') ||
            e.target.classList.contains('flash-note-export-btn')) return;

        isDragging = true;
        offsetX = e.clientX - container.getBoundingClientRect().left;
        offsetY = e.clientY - container.getBoundingClientRect().top;
        container.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        container.style.left = (e.clientX - offsetX) + 'px';
        container.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = '';
    });

    // 关闭面板
    header.querySelector('.flash-note-close').addEventListener('click', () => {
        container.style.display = 'none';
    });

    // 导出笔记
    header.querySelector('.flash-note-export-btn').addEventListener('click', exportNotes);

    // 显示/隐藏面板
    GM_registerMenuCommand('显示闪念笔记', () => {
        container.style.display = 'flex';
        refreshNotes();
    });

    // 保存笔记
    addNoteArea.querySelector('.flash-note-save').addEventListener('click', () => {
        const text = addNoteArea.querySelector('.flash-note-textarea').value.trim();

        if (!text) {
            GM_notification({
                title: '无法保存',
                text: '笔记内容不能为空',
                timeout: 2000
            });
            return;
        }

        const newNote = {
            text,
            url: window.location.href,
            domain: window.location.hostname,
            timestamp: new Date().getTime(),
            pageTitle: document.title
        };

        if (saveNote(newNote)) {
            addNoteArea.querySelector('.flash-note-textarea').value = '';
        }
    });

    // 搜索功能
    filter.querySelector('#flash-note-search').addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        refreshNotes();
    });

    // 注册快捷键打开面板 (Ctrl+Shift+N)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
            if (container.style.display === 'flex') {
                refreshNotes();
            }
        }
    });

    // 初始化
    initTabs();
    refreshNotes();
})();