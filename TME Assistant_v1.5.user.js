// ==UserScript==
// @name         TME Assistant
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  TME专属工具菜单 - AI Hub + 搜索中心 + 计算器工具 + 快捷键系统
// @author       Hazel
// @match        https://*.amazon.com/*
// @match        https://*.amazonaws.com/*
// @match        https://*.a2z.com/*
// @match        https://*.amazon.dev/*
// @match        https://*.amazon.sharepoint.com/*
// @match        https://*.amazon.awsapps.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
'use strict';

if (window !== window.top || document.querySelector('#tme-menu')) return;

const CONFIG = {
    VERSION: '1.5',
    COLORS: { PRIMARY: '#0F3E6B', SECONDARY: '#34B09F' },
    ANIMATION: { TOAST_DURATION: 3000 },
    STORAGE: {
        MENU_BOTTOM: 'tmeMenuBottom',
        MENU_RIGHT: 'tmeMenuRight',
        LAST_OU: 'tmeLastOU',
        LAST_TYPE: 'tmeLastType',
        LAST_DATE_TAB: 'tmeLastDateTab',
        LAST_CALC_TAB: 'tmeLastCalcTab',
        SEARCH_HISTORY: 'tmeSearchHistory',
        QUICK_JUMP_HISTORY: 'tmeQuickJumpHistory',
        SHORTCUTS_ENABLED: 'tmeShortcutsEnabled'
    },
    HISTORY: { MAX_SEARCH: 5, MAX_JUMP: 5 }
};

const SEARCH_CONFIG = {
    OUS: [
        { id: 'na', name: 'NA' },
        { id: 'eu', name: 'EU' },
        { id: 'fe', name: 'FE' }
    ],
    TYPES: [
        { id: 'CASE', name: 'Case', icon: '📋', needOU: true, platform: 'paragon' },
        { id: 'BLURB', name: 'Blurb', icon: '📝', needOU: true, platform: 'paragon' },
        { id: 'SOP', name: 'SOP', icon: '📚', needOU: true, platform: 'paragon' },
        { id: 'WIKI', name: 'Wiki', icon: '🌐', needOU: false, platform: 'wiki' },
        { id: 'TICKET', name: 'Ticket', icon: '🎫', needOU: false, platform: 'sim' }
    ],
    getDefaultOU: () => GM_getValue(CONFIG.STORAGE.LAST_OU, 'na'),
    getDefaultType: () => GM_getValue(CONFIG.STORAGE.LAST_TYPE, 'SOP')
};

GM_addStyle(`
#tme-menu{position:fixed;bottom:20px;right:20px;z-index:10000;user-select:none;font-family:'Microsoft YaHei',Calibri,sans-serif}
#tme-menu .ring-container{position:absolute;top:0;left:0;width:61px;height:61px;pointer-events:none}
#tme-menu .ring-container::before{content:'';position:absolute;top:-3px;left:-3px;right:-3px;bottom:-3px;border-radius:50%;background:linear-gradient(45deg,transparent 30%,rgba(52,176,159,0.5) 50%,transparent 70%);animation:rotatingRing 2s linear infinite}
#tme-menu .menu-trigger{width:59px;height:59px;background:#0F3E6B;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;cursor:pointer;font-family:Calibri,'Microsoft YaHei',sans-serif;font-size:18px;font-weight:bold;box-shadow:0 4px 15px rgba(15,62,107,0.4);transition:transform 0.3s;animation:breathingGlow 3s ease-in-out infinite;position:relative;z-index:2}
#tme-menu .menu-trigger::before{content:'';position:absolute;top:50%;left:50%;width:100%;height:100%;border:2px solid rgba(52,176,159,0.6);border-radius:50%;animation:pulseRipple 3s ease-out infinite;pointer-events:none;transform:translate(-50%,-50%)}
@keyframes breathingGlow{0%,100%{box-shadow:0 4px 15px rgba(15,62,107,0.4)}50%{box-shadow:0 4px 25px rgba(15,62,107,0.6),0 0 30px rgba(52,176,159,0.3)}}
@keyframes pulseRipple{0%{width:100%;height:100%;opacity:0.8}100%{width:140%;height:140%;opacity:0}}
@keyframes rotatingRing{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
#tme-menu .menu-trigger:hover{transform:scale(1.1);background:#34B09F}
#tme-menu .menu-items{position:absolute;bottom:70px;right:0;display:none;flex-direction:column;gap:8px}
#tme-menu.menu-open .menu-items{display:flex}
#tme-menu .menu-item{padding:8px 15px;background:#0F3E6B;color:#ffffff;border-radius:20px;cursor:pointer;white-space:nowrap;transition:all 0.3s;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:13px;font-family:'Microsoft YaHei',Calibri,sans-serif;position:relative}
#tme-menu .menu-item:hover{background:#34B09F;transform:translateX(-5px)}
#tme-menu .menu-item.has-submenu .submenu-items{position:absolute;top:0;right:100%;margin-right:10px;display:none;flex-direction:column;gap:8px;z-index:10002}
#tme-menu .menu-item.has-submenu.active .submenu-items{display:flex}
#tme-menu .submenu-item{padding:8px 15px;background:#0F3E6B;color:#ffffff;border-radius:20px;cursor:pointer;white-space:nowrap;transition:all 0.3s;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:13px}
#tme-menu .submenu-item:hover{background:#34B09F;transform:translateX(-5px)}
#tme-menu .menu-item.cookie-cleaner{background:linear-gradient(135deg,#0F3E6B 0%,#1a5490 100%)}
#tme-menu .menu-item.cookie-cleaner:hover{background:linear-gradient(135deg,#1a5490 0%,#2569a8 100%)}
.tme-ai-panel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.3);padding:24px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;z-index:10001;display:none;font-family:'Microsoft YaHei',Calibri,sans-serif}
.tme-ai-panel.show{display:block;animation:fadeIn 0.3s ease}
.tme-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:none}
.tme-overlay.show{display:block}
.tme-ai-panel h2{margin:0 0 20px 0;color:#0F3E6B;font-size:20px}
.tme-close-btn{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:#f0f0f0;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;color:#666;transition:all 0.2s}
.tme-close-btn:hover{background:#e0e0e0;color:#333}
.tme-input-group{margin-bottom:20px}
.tme-input-group label{display:block;margin-bottom:8px;color:#0F3E6B;font-weight:600;font-size:14px}
.tme-input-with-button{display:flex;gap:10px;align-items:stretch}
.tme-input-with-button input{flex:1;min-width:0}
.tme-input-with-button .tme-btn{flex-shrink:0;align-self:stretch;display:flex;align-items:center;justify-content:center;padding:0 20px}
.tme-type-selector{display:flex;gap:10px;flex-wrap:wrap}
.tme-type-btn{flex:1;min-width:90px;padding:10px;background:#f0f0f0;border:2px solid #e0e0e0;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#666;transition:all 0.2s}
.tme-type-btn:hover{background:#e0e0e0}
.tme-type-btn.active{background:#0F3E6B;border-color:#0F3E6B;color:#fff}
.tme-ou-selector.hidden{display:none}
.tme-input-group input,.tme-input-group textarea,.tme-input-group select{width:100%;padding:10px 14px;border:2px solid #e0e0e0;border-radius:8px;font-size:14px;color:#333!important;background:white!important;transition:border-color 0.2s;box-sizing:border-box;resize:vertical;line-height:normal;display:flex;align-items:center}
.tme-input-group input[type="date"]{padding:7px 14px;line-height:2;height:42px;box-sizing:border-box}
.tme-input-group input[type="datetime-local"],.tme-input-group input[type="number"]{text-align:left}
.tme-input-group input:focus,.tme-input-group textarea:focus,.tme-input-group select:focus{outline:none;border-color:#0F3E6B}
.tme-btn{padding:10px 24px;background:#0F3E6B;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap}
.tme-btn:hover{background:#34B09F;transform:translateY(-1px)}
.tme-btn.secondary{background:#6c757d;margin-left:10px}
.tme-btn.secondary:hover{background:#5a6268}
.tme-btn.danger{background:#f44336;padding:6px 12px;font-size:12px}
.tme-btn.danger:hover{background:#d32f2f}
.tme-btn.secondary.green{background:#34B09F}
.tme-btn.secondary.green:hover{background:#2a9485}
.tme-result-box{background:#f8f9fa;border-radius:12px;padding:16px;margin-top:20px;border-left:4px solid #0F3E6B}
.tme-result-box h3{margin:0 0 12px 0;color:#0F3E6B;font-size:14px;font-weight:600}
.tme-result-box p{margin:8px 0;color:#333;line-height:1.6}
.tme-result-box ul{margin:8px 0;padding-left:20px;color:#333;line-height:1.6}
.tme-result-box li{margin:4px 0}
.tme-history-section{background:#f8f9fa;border-radius:12px;padding:16px;margin-top:20px;border-left:4px solid #0F3E6B}
.tme-history-section .history-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.tme-history-section h3{margin:0;color:#0F3E6B;font-size:14px;font-weight:600}
.tme-history-item{padding:8px 12px;background:white;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:8px;cursor:pointer;transition:all 0.2s;display:flex;justify-content:space-between;align-items:center}
.tme-history-item:hover{background:#f8f9fa;border-color:#0F3E6B}
.tme-history-item .history-content{flex:1;font-size:13px;color:#333;display:flex;align-items:center;gap:8px}
.tme-history-item .history-content strong{color:#0F3E6B;font-weight:600}
.tme-history-item .history-meta{font-size:11px;color:#999}
.tme-history-item .history-time{font-size:11px;color:#999;margin-left:10px;white-space:nowrap}
.tme-history-item .history-delete{margin-left:10px;padding:2px 8px;background:transparent;border:none;color:#999;cursor:pointer;font-size:16px}
.tme-history-item .history-delete:hover{color:#f44336}
.tme-hint-text{font-size:12px;color:#999;margin-top:8px;line-height:1.5}
.tme-tabs{display:flex;gap:10px;margin-bottom:20px;border-bottom:2px solid #e0e0e0}
.tme-tab{padding:10px 20px;background:transparent;border:none;border-bottom:3px solid transparent;cursor:pointer;font-size:14px;font-weight:600;color:#666;transition:all 0.2s}
.tme-tab:hover{color:#0F3E6B}
.tme-tab.active{color:#0F3E6B;border-bottom-color:#0F3E6B}
.tme-tab-content{display:none}
.tme-tab-content.active{display:block}
.tme-toast{position:fixed;top:20px;right:20px;background:#323232;color:#fff;padding:16px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:1000000;animation:slideIn 0.3s ease;font-size:14px}
.tme-toast.success{background:#4caf50}
.tme-toast.error{background:#f44336}
.tme-toast.info{background:#0F3E6B}
@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(400px);opacity:0}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.calc-section{background:#f8f9fa;padding:16px;border-radius:8px;margin-bottom:16px}
.calc-section h3{color:#0F3E6B;margin:0 0 12px 0;font-size:15px}
.calc-section.hidden{display:none}
.calc-grid{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}
.calc-btn-sm{flex:1;min-width:100px;padding:10px;background:#34B09F;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;transition:all 0.2s;font-weight:600}
.calc-btn-sm:hover{background:#2a9485;transform:translateY(-1px)}
.calc-btn-sm.primary{background:#0F3E6B}
.calc-btn-sm.primary:hover{background:#0d3558}
.calc-result{margin-top:12px;padding:12px;background:white;border-radius:6px;display:none;border:2px solid #e0e0e0}
.calc-result.show{display:block}
.calc-tz-row{padding:10px 12px;background:#f8f9fa;border-radius:6px;border-left:4px solid #34B09F;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;font-size:14px}
.calc-tz-row.source{background:#e3f2fd;border-left-color:#0F3E6B}
.calc-tz-row .tz-name{font-weight:600;color:#333;min-width:80px}
.calc-tz-row .tz-time{color:#0F3E6B;font-family:monospace;flex:1;text-align:center}
.calc-tz-row .tz-day{color:#666;font-size:13px;min-width:70px;text-align:right}
.calc-date-result{padding:12px;background:#f8f9fa;border-radius:6px;font-size:15px;color:#333;text-align:center;border-left:4px solid #0F3E6B}
.calc-input-btn-row{display:flex;gap:10px;align-items:flex-end}
.calc-input-btn-row .tme-input-group{flex:1;margin-bottom:0}
.calc-input-btn-row .tme-btn{margin:0;font-size:13.5px;padding:10px 20px;height:42px}
.calc-date-tabs{display:flex;gap:10px;margin-bottom:16px}
.calc-date-tab{flex:1;padding:10px;background:#f0f0f0;border:2px solid #e0e0e0;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:600;color:#666;transition:all 0.2s;text-align:center}
.calc-date-tab:hover{background:#e0e0e0}
.calc-date-tab.active{background:#0F3E6B;border-color:#0F3E6B;color:#fff}
.calc-date-section{display:none}
.calc-date-section.active{display:block}
.calc-time-input-row{display:flex;gap:10px;align-items:center}
.calc-time-input-row input{flex:1}
.calc-time-input-row .tme-btn{flex-shrink:0;white-space:nowrap;font-size:13px;padding:10px 16px}
.calc-stat-row{display:flex;gap:12px;flex-wrap:wrap}
.calc-stat-item{flex:1;min-width:80px;text-align:center;padding:12px;background:#f8f9fa;border-radius:6px}
.calc-stat-item .value{font-size:24px;font-weight:600;color:#0F3E6B}
.calc-stat-item .label{font-size:12px;color:#666;margin-top:4px}

/* 快捷键帮助面板 */
.tme-shortcuts-panel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.3);padding:24px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;z-index:10001;display:none;font-family:'Microsoft YaHei',Calibri,sans-serif}
.tme-shortcuts-panel.show{display:block;animation:fadeIn 0.3s ease}
.tme-shortcuts-panel h2{margin:0 0 20px 0;color:#0F3E6B;font-size:20px;display:flex;align-items:center;gap:12px}
.tme-shortcuts-panel .shortcuts-toggle{display:flex;align-items:center;justify-content:space-between;padding:16px;background:#f8f9fa;border-radius:8px;margin-bottom:20px}
.tme-shortcuts-panel .shortcuts-toggle label{font-weight:600;color:#333;cursor:pointer;display:flex;align-items:center;gap:8px}
.tme-shortcuts-panel .toggle-switch{position:relative;width:50px;height:26px;background:#ccc;border-radius:13px;cursor:pointer;transition:background 0.3s}
.tme-shortcuts-panel .toggle-switch.active{background:#34B09F}
.tme-shortcuts-panel .toggle-switch::after{content:'';position:absolute;top:3px;left:3px;width:20px;height:20px;background:white;border-radius:50%;transition:left 0.3s}
.tme-shortcuts-panel .toggle-switch.active::after{left:27px}
.tme-shortcut-list{list-style:none;padding:0;margin:0}
.tme-shortcut-item{display:flex;align-items:center;justify-content:space-between;padding:14px;border-bottom:1px solid #e0e0e0;transition:background 0.2s}
.tme-shortcut-item:hover{background:#f8f9fa}
.tme-shortcut-item:last-child{border-bottom:none}
.tme-shortcut-item .shortcut-desc{color:#333;font-size:14px;font-weight:500}
.tme-shortcut-item .shortcut-keys{display:flex;gap:4px}
.tme-shortcut-key{display:inline-block;padding:4px 10px;background:#f0f0f0;border:1px solid #d0d0d0;border-radius:6px;font-size:12px;font-weight:600;color:#666;font-family:monospace;box-shadow:0 2px 0 #d0d0d0}
.tme-shortcuts-footer{margin-top:20px;padding-top:16px;border-top:2px solid #e0e0e0;text-align:center;color:#666;font-size:13px}
`);
// 工具函数
const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `tme-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => document.body.contains(toast) && document.body.removeChild(toast), 300);
    }, CONFIG.ANIMATION.TOAST_DURATION);
};

const isTicketID = input => /^[VDP]\d+$/i.test(input.trim()) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.trim());

// 历史记录管理器
const HistoryManager = {
    _save(key, item, max) {
        let history = this._get(key);
        history = history.filter(h => JSON.stringify(h) !== JSON.stringify(item));
        history.unshift({ ...item, timestamp: Date.now() });
        GM_setValue(key, JSON.stringify(history.slice(0, max)));
    },
    _get(key) {
        try { return JSON.parse(GM_getValue(key, '[]')); } catch { return []; }
    },
    _delete(key, index) {
        let history = this._get(key);
        history.splice(index, 1);
        GM_setValue(key, JSON.stringify(history));
    },
    saveSearch(keyword, type, ou = null) {
        this._save(CONFIG.STORAGE.SEARCH_HISTORY, { keyword, type, ou }, CONFIG.HISTORY.MAX_SEARCH);
    },
    getSearchHistory() { return this._get(CONFIG.STORAGE.SEARCH_HISTORY); },
    deleteSearchItem(index) { this._delete(CONFIG.STORAGE.SEARCH_HISTORY, index); },
    clearSearchHistory() { GM_setValue(CONFIG.STORAGE.SEARCH_HISTORY, '[]'); },
    saveQuickJump(caseId, ou) {
        this._save(CONFIG.STORAGE.QUICK_JUMP_HISTORY, { caseId, ou }, CONFIG.HISTORY.MAX_JUMP);
    },
    getQuickJumpHistory() { return this._get(CONFIG.STORAGE.QUICK_JUMP_HISTORY); },
    deleteJumpItem(index) { this._delete(CONFIG.STORAGE.QUICK_JUMP_HISTORY, index); },
    clearJumpHistory() { GM_setValue(CONFIG.STORAGE.QUICK_JUMP_HISTORY, '[]'); },
    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
};

// Cookie 清理
const clearAllCookies = () => {
    const cookies = document.cookie.split(";");
    const domain = window.location.hostname;
    const mainDomain = domain.split('.').slice(-2).join('.');

    cookies.forEach(cookie => {
        const name = cookie.split("=")[0].trim();
        const expiry = "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + expiry;
        document.cookie = name + expiry + ";domain=" + domain;
        document.cookie = name + expiry + ";domain=." + mainDomain;
    });

    if (cookies.length > 0) {
        showToast(`✅ 成功清除 ${cookies.length} 个Cookie！`, 'success');
        setTimeout(() => {
            showToast('🔄 即将刷新页面...', 'info');
            setTimeout(() => location.reload(), 1000);
        }, 2000);
    } else {
        showToast('ℹ️ 未找到需要清除的Cookie', 'info');
    }
};

// 监听 400 错误
window.fetch = new Proxy(window.fetch, {
    apply: (target, thisArg, args) => target.apply(thisArg, args).then(response => {
        if (response.status === 400) showToast('⚠️ 检测到400错误，建议清除Cookie', 'error');
        return response;
    })
});

// 计算器工具
const createCalcPanel = () => {
    const lastDateTab = GM_getValue(CONFIG.STORAGE.LAST_DATE_TAB, 'interval');
    const lastCalcTab = GM_getValue(CONFIG.STORAGE.LAST_CALC_TAB, 'tz');

    return `
    <button class="tme-close-btn">×</button>
    <h2 style="display:flex;align-items:center;gap:12px;"><span style="font-size:32px;">🧮</span>Calculator Tools</h2>
    <div class="tme-tabs">
        <button class="tme-tab ${lastCalcTab === 'tz' ? 'active' : ''}" data-tab="tz">🌍 时区转换</button>
        <button class="tme-tab ${lastCalcTab === 'date' ? 'active' : ''}" data-tab="date">📅 日期计算</button>
        <button class="tme-tab ${lastCalcTab === 'text' ? 'active' : ''}" data-tab="text">📝 文本处理</button>
    </div>

    <div class="tme-tab-content ${lastCalcTab === 'tz' ? 'active' : ''}" data-tab-content="tz">
        <div class="tme-input-group">
            <label>输入时间：</label>
            <div class="calc-time-input-row">
                <input type="datetime-local" id="tzInput" step="60">
                <button class="tme-btn secondary green" id="tzNow">👉 点击此处使用当前时间</button>
            </div>
        </div>
        <div class="calc-input-btn-row">
            <div class="tme-input-group">
                <label>选择目标时区：</label>
                <select id="tzSource">
                    <option value="UTC">UTC (UTC+0)</option>
                    <option value="Asia/Shanghai">北京 (UTC+8)</option>
                    <option value="America/Los_Angeles">洛杉矶 (UTC-8/-7)</option>
                    <option value="America/Mexico_City">墨西哥城 (UTC-6/-5)</option>
                    <option value="Europe/Berlin">柏林 (UTC+1/+2)</option>
                    <option value="Europe/London">伦敦 (UTC+0/+1)</option>
                    <option value="Asia/Tokyo">东京 (UTC+9)</option>
                </select>
            </div>
            <button class="tme-btn" id="tzConvert">🔄 转换</button>
        </div>
        <div id="tzResult" class="calc-result"></div>
    </div>

    <div class="tme-tab-content ${lastCalcTab === 'date' ? 'active' : ''}" data-tab-content="date">
        <div class="calc-date-tabs">
            <button class="calc-date-tab ${lastDateTab === 'interval' ? 'active' : ''}" data-date-tab="interval">📊 日期间隔</button>
            <button class="calc-date-tab ${lastDateTab === 'add' ? 'active' : ''}" data-date-tab="add">🧮 日期加减</button>
        </div>

        <div class="calc-date-section ${lastDateTab === 'interval' ? 'active' : ''}" data-date-section="interval">
            <div class="tme-input-group" style="margin-bottom:12px;">
                <label>开始日期：</label>
                <input type="date" id="dateStart">
            </div>
            <div class="tme-input-group" style="margin-bottom:12px;">
                <label>结束日期：</label>
                <input type="date" id="dateEnd">
            </div>
            <button class="tme-btn" id="dateDiff" style="font-size:13.5px;width:100%;">🔄 计算</button>
            <div id="diffResult" class="calc-result"></div>
        </div>

        <div class="calc-date-section ${lastDateTab === 'add' ? 'active' : ''}" data-date-section="add">
            <div class="tme-input-group" style="margin-bottom:12px;">
                <label>基准日期：</label>
                <input type="date" id="dateBase">
            </div>
            <div class="tme-input-group" style="margin-bottom:12px;">
                <label>天数（正数加/负数减）：</label>
                <input type="number" id="dateDays" placeholder="例如：30 或 -15">
            </div>
            <button class="tme-btn" id="dateAdd" style="font-size:13.5px;width:100%;">🔄 计算</button>
            <div id="addResult" class="calc-result"></div>
        </div>
    </div>

    <div class="tme-tab-content ${lastCalcTab === 'text' ? 'active' : ''}" data-tab-content="text">
        <div class="tme-input-group">
            <label>输入文本：</label>
            <textarea id="textInput" placeholder="在此输入或粘贴文本..." style="min-height:150px;font-family:monospace;"></textarea>
        </div>
        <div class="calc-grid">
            <button class="calc-btn-sm" data-action="to-space">转空格</button>
            <button class="calc-btn-sm" data-action="to-comma">转逗号</button>
            <button class="calc-btn-sm" data-action="to-newline">转换行</button>
            <button class="calc-btn-sm primary" data-action="dup">🔄 去重</button>
            <button class="calc-btn-sm primary" data-action="cnt">📊 统计</button>
        </div>
        <div id="textResult" class="calc-result"></div>
    </div>
`;
};

const initCalculator = modal => {
    modal.querySelectorAll('.tme-tab').forEach(tab => {
        tab.onclick = function() {
            const selectedTab = this.dataset.tab;
            modal.querySelectorAll('.tme-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.tme-tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            modal.querySelector(`[data-tab-content="${selectedTab}"]`).classList.add('active');
            GM_setValue(CONFIG.STORAGE.LAST_CALC_TAB, selectedTab);
        };
    });

    modal.querySelectorAll('.calc-date-tab').forEach(tab => {
        tab.onclick = function() {
            const selectedTab = this.dataset.dateTab;
            modal.querySelectorAll('.calc-date-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.calc-date-section').forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            modal.querySelector(`[data-date-section="${selectedTab}"]`).classList.add('active');
            GM_setValue(CONFIG.STORAGE.LAST_DATE_TAB, selectedTab);
        };
    });

    const tzInput = modal.querySelector('#tzInput');
    modal.querySelector('#tzNow').onclick = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        tzInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    modal.querySelector('#tzConvert').onclick = () => {
        if (!tzInput.value) return showToast('⚠️ 请输入时间', 'error');
        const zones = [
            ['UTC', 'UTC'],
            ['北京', 'Asia/Shanghai'],
            ['洛杉矶', 'America/Los_Angeles'],
            ['墨西哥城', 'America/Mexico_City'],
            ['柏林', 'Europe/Berlin'],
            ['伦敦', 'Europe/London'],
            ['东京', 'Asia/Tokyo']
        ];
        const date = new Date(tzInput.value);
        const source = modal.querySelector('#tzSource').value;
        const result = modal.querySelector('#tzResult');

        result.innerHTML = zones.map(([name, zone]) => {
            const timeStr = date.toLocaleString('zh-CN', {
                timeZone: zone,
                hour12: false,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\//g, '/');
            const day = date.toLocaleString('zh-CN', { timeZone: zone, weekday: 'long' });
            const isSource = zone === source;
            return `<div class="calc-tz-row ${isSource ? 'source' : ''}">
                <span class="tz-name">${name}</span>
                <span class="tz-time">${timeStr}</span>
                <span class="tz-day">${day}</span>
            </div>`;
        }).join('');
        result.classList.add('show');
        showToast('✅ 转换完成', 'success');
    };

    const today = new Date().toISOString().split('T')[0];
    ['dateStart', 'dateEnd', 'dateBase'].forEach(id => {
        const input = modal.querySelector(`#${id}`);
        if (input) input.value = today;
    });

    modal.querySelector('#dateDiff').onclick = () => {
        const start = new Date(modal.querySelector('#dateStart').value);
        const end = new Date(modal.querySelector('#dateEnd').value);
        const days = Math.ceil(Math.abs(end - start) / 86400000);
        modal.querySelector('#diffResult').innerHTML = `<div class="calc-date-result">相差 ${days} 天</div>`;
        modal.querySelector('#diffResult').classList.add('show');
        showToast('✅ 计算完成', 'success');
    };

    const calculateDateAdd = () => {
        const base = new Date(modal.querySelector('#dateBase').value);
        const days = parseInt(modal.querySelector('#dateDays').value);
        if (!days && days !== 0) return showToast('⚠️ 请输入天数', 'error');
        const result = new Date(base);
        result.setDate(result.getDate() + days);
        const dateStr = result.toISOString().split('T')[0];
        const weekday = result.toLocaleDateString('zh-CN', { weekday: 'long' });
        modal.querySelector('#addResult').innerHTML = `<div class="calc-date-result">${dateStr} | ${weekday}</div>`;
        modal.querySelector('#addResult').classList.add('show');
        showToast('✅ 计算完成', 'success');
    };

    modal.querySelector('#dateAdd').onclick = calculateDateAdd;
    modal.querySelector('#dateDays').addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculateDateAdd();
        }
    });

    const textInput = modal.querySelector('#textInput');
    modal.querySelectorAll('[data-action]').forEach(btn => {
        btn.onclick = () => {
            let text = textInput.value;
            if (!text.trim()) return showToast('⚠️ 请输入文本', 'error');

            const actions = {
                'to-space': () => {
                    textInput.value = text.split(/[\s,\n]+/).filter(item => item.trim()).join(' ');
                    showToast('✅ 已转换为空格分隔', 'success');
                },
                'to-comma': () => {
                    textInput.value = text.split(/[\s,\n]+/).filter(item => item.trim()).join(',');
                    showToast('✅ 已转换为逗号分隔', 'success');
                },
                'to-newline': () => {
                    textInput.value = text.split(/[\s,\n]+/).filter(item => item.trim()).join('\n');
                    showToast('✅ 已转换为换行分隔', 'success');
                },
                'dup': () => {
                    const items = text.split(/[\s,\n]+/).map(l => l.trim()).filter(l => l);
                    const unique = [...new Set(items)];
                    textInput.value = unique.join('\n');
                    showToast(`✅ 去重：${items.length} → ${unique.length}`, 'success');
                },
                'cnt': () => {
                    const stats = [
                        ['总字符', text.length],
                        ['不含空格', text.replace(/\s/g, '').length],
                        ['单词数', text.trim().split(/\s+/).filter(w => w).length],
                        ['总行数', text.split('\n').length],
                        ['唯一行', new Set(text.split('\n').map(l => l.trim()).filter(l => l)).size]
                    ];
                    const result = modal.querySelector('#textResult');
                    result.innerHTML = `<div class="calc-stat-row">
                        ${stats.map(([name, val]) => `<div class="calc-stat-item">
                            <div class="value">${val}</div>
                            <div class="label">${name}</div>
                        </div>`).join('')}
                    </div>`;
                    result.classList.add('show');
                    showToast('✅ 统计完成', 'success');
                }
            };

            actions[btn.dataset.action]?.();
        };
    });
};

// 生成按钮 HTML
const createButtons = (items, selectedId, dataAttr) =>
    items.map(item =>
        `<button class="tme-type-btn ${item.id === selectedId ? 'active' : ''}" data-${dataAttr}="${item.id}" ${item.needOU !== undefined ? `data-need-ou="${item.needOU}" data-platform="${item.platform}"` : ''}>${item.icon || ''} ${item.name}</button>`
    ).join('');

// 面板创建
const createSearchHubPanel = () => {
    const currentType = SEARCH_CONFIG.TYPES.find(t => t.id === selectedType);
    return `
        <button class="tme-close-btn">×</button>
        <h2>🔍 Search Hub</h2>
        <div class="tme-input-group">
            <label>请选择搜索类型：</label>
            <div class="tme-type-selector">${createButtons(SEARCH_CONFIG.TYPES, selectedType, 'type')}</div>
        </div>
        <div class="tme-input-group tme-ou-selector ${currentType?.needOU ? '' : 'hidden'}" id="ou-selector-group">
            <label>请选择 OU：</label>
            <div class="tme-type-selector">${createButtons(SEARCH_CONFIG.OUS, selectedOU, 'ou')}</div>
        </div>
        <div class="tme-input-group">
            <label>请输入关键词或 ID：</label>
            <div class="tme-input-with-button">
                <input type="text" id="tme-search-keyword" placeholder="例如：库存、促销、付款 或 Ticket ID">
                <button class="tme-btn" id="tme-search-btn">🔍 搜索</button>
            </div>
        </div>
        <div id="tme-search-result"></div>
        <div id="tme-search-history-container"></div>
    `;
};

const createCaseJumpPanel = () => `
    <button class="tme-close-btn">×</button>
    <h2>⚡ Case Quick Jump</h2>
    <div class="tme-tabs">
        <button class="tme-tab active" data-tab="single">⚡ Single</button>
        <button class="tme-tab" data-tab="batch">📋 Multiple</button>
    </div>
    <div class="tme-tab-content active" data-tab-content="single">
        <div class="tme-input-group">
            <label>请选择 OU：</label>
            <div class="tme-type-selector">${createButtons(SEARCH_CONFIG.OUS, selectedOU, 'ou')}</div>
        </div>
        <div class="tme-input-group">
            <label>请输入 Case ID：</label>
            <div class="tme-input-with-button">
                <input type="text" id="tme-case-id" placeholder="例如：18071511111">
                <button class="tme-btn" id="tme-jump-btn">⚡ 跳转</button>
            </div>
        </div>
        <div id="tme-jump-result"></div>
        <div id="tme-jump-history-container"></div>
    </div>
    <div class="tme-tab-content" data-tab-content="batch">
        <div class="tme-input-group">
            <label>请选择 OU：</label>
            <div class="tme-type-selector" id="batch-ou-selector">${createButtons(SEARCH_CONFIG.OUS, selectedOU, 'ou')}</div>
        </div>
        <div class="tme-input-group">
            <label>请输入多个 Case ID（用逗号、空格或换行分隔）：</label>
            <textarea id="tme-batch-case-ids" rows="6" placeholder="例如：&#10;18071511111, 18071511112&#10;18071511113 18071511114&#10;18071511115"></textarea>
            <div class="tme-hint-text">💡 支持格式：逗号、空格、换行分隔或混合使用</div>
        </div>
        <button class="tme-btn" id="tme-batch-jump-btn">📋 批量跳转</button>
        <div id="tme-batch-jump-result"></div>
    </div>
`;
// 历史记录渲染
const renderHistory = (containerId, history, type) => {
    const container = document.getElementById(containerId);
    if (!container || history.length === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    const title = type === 'search' ? '🕒 最近搜索' : '🕒 最近访问';
    const clearBtnId = type === 'search' ? 'clear-search-history-btn' : 'clear-jump-history-btn';

    const items = history.map((item, index) => {
        if (type === 'search') {
            const typeInfo = SEARCH_CONFIG.TYPES.find(t => t.id === item.type);
            const metaText = item.ou ? `${item.ou.toUpperCase()} · ${typeInfo?.name || item.type}` : typeInfo?.name || item.type;
            return `
                <div class="tme-history-item" data-index="${index}">
                    <div class="history-content">
                        <span>${typeInfo?.icon || '🔍'}</span>
                        <strong>${item.keyword}</strong>
                        <span class="history-meta">(${metaText})</span>
                    </div>
                    <span class="history-time">${HistoryManager.formatTime(item.timestamp)}</span>
                    <button class="history-delete" data-index="${index}">×</button>
                </div>
            `;
        } else {
            return `
                <div class="tme-history-item" data-index="${index}">
                    <div class="history-content">
                        <strong>Case ${item.caseId}</strong>
                        <span class="history-meta">(${item.ou.toUpperCase()})</span>
                    </div>
                    <span class="history-time">${HistoryManager.formatTime(item.timestamp)}</span>
                    <button class="history-delete" data-index="${index}">×</button>
                </div>
            `;
        }
    }).join('');

    container.innerHTML = `
        <div class="tme-history-section">
            <div class="history-header">
                <h3>${title}</h3>
                <button class="tme-btn danger" id="${clearBtnId}">🗑️ 清空</button>
            </div>
            ${items}
        </div>
    `;

    attachHistoryListeners(containerId, type);
};

// 历史记录事件监听
const attachHistoryListeners = (containerId, type) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const clearBtn = container.querySelector('.tme-btn.danger');
    if (clearBtn) {
        clearBtn.onclick = e => {
            e.stopPropagation();
            if (confirm(`确定要清空所有${type === 'search' ? '搜索' : '访问'}历史吗？`)) {
                type === 'search' ? HistoryManager.clearSearchHistory() : HistoryManager.clearJumpHistory();
                renderHistory(containerId, [], type);
                showToast(`✅ ${type === 'search' ? '搜索' : '访问'}历史已清空`, 'success');
            }
        };
    }

    container.querySelectorAll('.tme-history-item').forEach(item => {
        item.onclick = function(e) {
            if (e.target.classList.contains('history-delete')) return;
            const index = parseInt(this.getAttribute('data-index'));
            const history = type === 'search' ? HistoryManager.getSearchHistory() : HistoryManager.getQuickJumpHistory();
            const historyItem = history[index];

            if (type === 'search' && historyItem) {
                selectedType = historyItem.type;
                if (historyItem.ou) selectedOU = historyItem.ou;
                document.getElementById('tme-search-keyword').value = historyItem.keyword;

                document.querySelectorAll('[data-type]').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-type') === selectedType);
                });

                const needOU = SEARCH_CONFIG.TYPES.find(t => t.id === selectedType)?.needOU;
                const ouGroup = document.getElementById('ou-selector-group');
                if (ouGroup) {
                    ouGroup.classList.toggle('hidden', !needOU);
                    if (needOU) {
                        document.querySelectorAll('#ou-selector-group [data-ou]').forEach(btn => {
                            btn.classList.toggle('active', btn.getAttribute('data-ou') === selectedOU);
                        });
                    }
                }
                performSearch();
            } else if (type === 'jump' && historyItem) {
                selectedOU = historyItem.ou;
                document.getElementById('tme-case-id').value = historyItem.caseId;
                document.querySelectorAll('[data-tab-content="single"] [data-ou]').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-ou') === selectedOU);
                });
                quickJumpToCase();
            }
        };
    });

    container.querySelectorAll('.history-delete').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const index = parseInt(this.getAttribute('data-index'));
            type === 'search' ? HistoryManager.deleteSearchItem(index) : HistoryManager.deleteJumpItem(index);
            const history = type === 'search' ? HistoryManager.getSearchHistory() : HistoryManager.getQuickJumpHistory();
            renderHistory(containerId, history, type);
        };
    });
};

// 按钮选择器通用逻辑
const setupButtonSelector = (selector, callback) => {
    document.querySelectorAll(selector).forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            callback(this);
        };
    });
};

// Search Hub 初始化
let selectedOU = SEARCH_CONFIG.getDefaultOU();
let selectedType = SEARCH_CONFIG.getDefaultType();

const initSearchHub = () => {
    setupButtonSelector('[data-type]', btn => {
        selectedType = btn.getAttribute('data-type');
        const needOU = btn.getAttribute('data-need-ou') === 'true';
        document.getElementById('ou-selector-group').classList.toggle('hidden', !needOU);
        GM_setValue(CONFIG.STORAGE.LAST_TYPE, selectedType);
    });

    setupButtonSelector('#ou-selector-group [data-ou]', btn => {
        selectedOU = btn.getAttribute('data-ou');
        GM_setValue(CONFIG.STORAGE.LAST_OU, selectedOU);
    });

    document.getElementById('tme-search-btn').onclick = performSearch;
    document.getElementById('tme-search-keyword').addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    renderHistory('tme-search-history-container', HistoryManager.getSearchHistory(), 'search');
};

// 搜索执行
const performSearch = () => {
    const keyword = document.getElementById('tme-search-keyword').value.trim();
    if (!keyword) {
        showToast('⚠️ 请输入搜索关键词或 ID', 'error');
        return;
    }

    const currentType = SEARCH_CONFIG.TYPES.find(t => t.id === selectedType);
    if (!currentType) return;

    let searchUrl, displayInfo;

    if (currentType.platform === 'paragon') {
        searchUrl = `https://paragon-${selectedOU}.amazon.com/hz/search?searchQuery=${encodeURIComponent(keyword)}&contentType=${selectedType}&sortField=id&sortOrder=desc#`;
        displayInfo = `<p><strong>平台：</strong>Paragon</p><p><strong>OU：</strong>${selectedOU.toUpperCase()}</p><p><strong>类型：</strong>${currentType.name}</p><p><strong>关键词：</strong>${keyword}</p>`;
        HistoryManager.saveSearch(keyword, selectedType, selectedOU);
    } else if (currentType.platform === 'wiki') {
        searchUrl = `https://w.amazon.com/bin/view/Main/Search?q=${encodeURIComponent(keyword)}&start=1&domains=ALL`;
        displayInfo = `<p><strong>平台：</strong>Wiki</p><p><strong>关键词：</strong>${keyword}</p>`;
        HistoryManager.saveSearch(keyword, selectedType, null);
    } else if (currentType.platform === 'sim') {
        if (isTicketID(keyword)) {
            searchUrl = `https://t.corp.amazon.com/${keyword.trim()}`;
            displayInfo = `<p><strong>平台：</strong>SIM Ticket</p><p><strong>Ticket ID：</strong>${keyword}</p><p><strong>操作：</strong>直接跳转到 Ticket</p>`;
        } else {
            searchUrl = `https://t.corp.amazon.com/issues?q=${encodeURIComponent(JSON.stringify({"keyword": `(${keyword})`}))}`;
            displayInfo = `<p><strong>平台：</strong>SIM Ticket</p><p><strong>关键词：</strong>${keyword}</p><p><strong>操作：</strong>搜索相关 Ticket</p>`;
        }
        HistoryManager.saveSearch(keyword, selectedType, null);
    }

    document.getElementById('tme-search-result').innerHTML = `
        <div class="tme-result-box">
            <h3>🔍 正在搜索...</h3>
            ${displayInfo}
            <p style="margin-top:12px">正在为你打开搜索页面，请稍候...</p>
            <p style="margin-top:12px"><a href="${searchUrl}" target="_blank" style="color:${CONFIG.COLORS.PRIMARY};font-weight:600">👉 点击这里手动打开</a></p>
            <p style="margin-top:12px;font-size:12px;color:#666">💡 提示：如果浏览器阻止了弹窗，请点击上方链接手动打开</p>
        </div>
    `;

    renderHistory('tme-search-history-container', HistoryManager.getSearchHistory(), 'search');
    window.open(searchUrl, '_blank');
    showToast('✅ 搜索页面已打开', 'success');
};

// Case Jump 初始化
const initCaseJump = () => {
    document.querySelectorAll('.tme-tab').forEach(tab => {
        tab.onclick = function() {
            const targetTab = this.getAttribute('data-tab');
            document.querySelectorAll('.tme-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tme-tab-content').forEach(content => {
                content.classList.toggle('active', content.getAttribute('data-tab-content') === targetTab);
            });
        };
    });

    const syncOUSelection = ou => {
        selectedOU = ou;
        GM_setValue(CONFIG.STORAGE.LAST_OU, selectedOU);
        document.querySelectorAll('[data-ou]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-ou') === selectedOU);
        });
    };

    setupButtonSelector('[data-tab-content="single"] [data-ou]', btn => syncOUSelection(btn.getAttribute('data-ou')));
    setupButtonSelector('#batch-ou-selector [data-ou]', btn => syncOUSelection(btn.getAttribute('data-ou')));

    document.getElementById('tme-jump-btn').onclick = quickJumpToCase;
    document.getElementById('tme-case-id').addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            quickJumpToCase();
        }
    });
    document.getElementById('tme-batch-jump-btn').onclick = batchJumpToCases;

    renderHistory('tme-jump-history-container', HistoryManager.getQuickJumpHistory(), 'jump');
};

// 快速跳转
const quickJumpToCase = () => {
    const caseId = document.getElementById('tme-case-id').value.trim();
    if (!caseId) {
        showToast('⚠️ 请输入 Case ID', 'error');
        return;
    }
    if (!/^\d+$/.test(caseId)) {
        showToast('⚠️ Case ID 格式不正确，请只输入数字', 'error');
        return;
    }

    HistoryManager.saveQuickJump(caseId, selectedOU);
    const caseUrl = `https://paragon-${selectedOU}.amazon.com/hz/view-case?caseId=${caseId}`;

    document.getElementById('tme-jump-result').innerHTML = `
        <div class="tme-result-box">
            <h3>⚡ 正在跳转...</h3>
            <p><strong>OU：</strong>${selectedOU.toUpperCase()}</p>
            <p><strong>Case ID：</strong>${caseId}</p>
            <p style="margin-top:12px">正在为你打开 Case 页面，请稍候...</p>
            <p style="margin-top:12px"><a href="${caseUrl}" target="_blank" style="color:${CONFIG.COLORS.PRIMARY};font-weight:600">👉 点击这里手动打开</a></p>
            <p style="margin-top:12px;font-size:12px;color:#666">💡 提示：如果浏览器阻止了弹窗，请点击上方链接手动打开</p>
        </div>
    `;

    renderHistory('tme-jump-history-container', HistoryManager.getQuickJumpHistory(), 'jump');
    window.open(caseUrl, '_blank');
    showToast('✅ Case 页面已打开', 'success');
};

// 批量跳转
const batchJumpToCases = () => {
    const input = document.getElementById('tme-batch-case-ids').value.trim();
    if (!input) {
        showToast('⚠️ 请输入至少一个 Case ID', 'error');
        return;
    }

    const caseIds = input.split(/[\s,\n]+/).map(id => id.trim()).filter(id => id.length > 0);
    const invalidIds = caseIds.filter(id => !/^\d+$/.test(id));

    if (invalidIds.length > 0) {
        showToast(`⚠️ 发现无效的 Case ID：${invalidIds.join(', ')}`, 'error');
        document.getElementById('tme-batch-jump-result').innerHTML = `
            <div class="tme-result-box">
                <h3>❌ 格式错误</h3>
                <p>以下 Case ID 格式不正确（只能包含数字）：</p>
                <ul>${invalidIds.map(id => `<li>${id}</li>`).join('')}</ul>
                <p style="margin-top:12px">请修正后重试。</p>
            </div>
        `;
        return;
    }

    const uniqueCaseIds = [...new Set(caseIds)];
    const duplicateCount = caseIds.length - uniqueCaseIds.length;

    document.getElementById('tme-batch-jump-result').innerHTML = `
        <div class="tme-result-box">
            <h3>📋 批量打开中...</h3>
            <p><strong>OU：</strong>${selectedOU.toUpperCase()}</p>
            <p><strong>Case 数量：</strong>${uniqueCaseIds.length} 个</p>
            ${duplicateCount > 0 ? `<p><strong>已去重：</strong>${duplicateCount} 个重复项</p>` : ''}
            <p style="margin-top:12px">正在为你打开以下 Case：</p>
            <ul>${uniqueCaseIds.map(id => `<li>Case ${id}</li>`).join('')}</ul>
            <p style="margin-top:12px;font-size:12px;color:#666">💡 提示：如果浏览器阻止了弹窗，请允许弹窗后重试</p>
        </div>
    `;

    uniqueCaseIds.forEach((caseId, index) => {
        setTimeout(() => {
            window.open(`https://paragon-${selectedOU}.amazon.com/hz/view-case?caseId=${caseId}`, '_blank');
            if (index === uniqueCaseIds.length - 1) {
                showToast(`✅ 成功打开 ${uniqueCaseIds.length} 个 Case 标签页`, 'success');
            }
        }, index * 200);
    });
};

// 快捷键系统
const SHORTCUTS_CONFIG = {
    'S': { action: () => openAIPanel('search-hub'), desc: '打开 Search Hub', icon: '🔍' },
    'J': { action: () => openAIPanel('case-quick-jump'), desc: '打开 Case Quick Jump', icon: '⚡' },
    'C': { action: () => openAIPanel('calculator'), desc: '打开 Calculator Tools', icon: '🧮' },
    'B': { action: () => window.open('https://w.amazon.com/bin/view/Baozipu_Project/Baozipu_List', '_blank'), desc: '打开 Baozipu', icon: '🥟' },
    'K': { action: () => window.open('https://share.amazon.com/sites/knowledgesharings/_layouts/15/WopiFrame2.aspx?sourcedoc=%7Ba7424a55-cf8c-4467-ac23-7d4fe0967b30%7D&action=editnew&IsDlg=1', '_blank'), desc: '打开 Knowki', icon: '📚' },
    'Q': { action: () => window.open('https://us-east-1.quicksight.aws.amazon.com/sn/account/amazonbi/start/agents', '_blank'), desc: '打开 Amazon Quick Suite', icon: '💎' },
    'H': { action: () => toggleShortcutsPanel(), desc: '显示快捷键帮助', icon: '❓' }
};

// 创建快捷键帮助面板
const createShortcutsPanel = () => {
    const panel = document.createElement('div');
    panel.className = 'tme-shortcuts-panel';
    panel.id = 'tme-shortcuts-panel';

    const shortcutsEnabled = GM_getValue(CONFIG.STORAGE.SHORTCUTS_ENABLED, true);

    const shortcutsList = Object.entries(SHORTCUTS_CONFIG)
        .map(([key, config]) => `
            <li class="tme-shortcut-item">
                <span class="shortcut-desc">${config.icon} ${config.desc}</span>
                <div class="shortcut-keys">
                    <span class="tme-shortcut-key">Ctrl</span>
                    <span style="color:#999">+</span>
                    <span class="tme-shortcut-key">Alt</span>
                    <span style="color:#999">+</span>
                    <span class="tme-shortcut-key">${key}</span>
                </div>
            </li>
        `).join('');

    panel.innerHTML = `
        <button class="tme-close-btn">×</button>
        <h2><span style="font-size:28px;">⌨️</span>快捷键帮助</h2>

        <div class="shortcuts-toggle">
            <label for="shortcuts-toggle-switch">
                <span style="font-size:18px;">🎯</span>
                启用全局快捷键
            </label>
            <div class="toggle-switch ${shortcutsEnabled ? 'active' : ''}" id="shortcuts-toggle-switch"></div>
        </div>

        <ul class="tme-shortcut-list">
            ${shortcutsList}
        </ul>

        <div class="tme-shortcuts-footer">
            💡 提示：快捷键在输入框中不会触发，避免干扰正常输入
        </div>
    `;

    document.body.appendChild(panel);

    panel.querySelector('.tme-close-btn').onclick = () => {
        panel.classList.remove('show');
        overlay.classList.remove('show');
    };

    const toggleSwitch = panel.querySelector('#shortcuts-toggle-switch');
    toggleSwitch.onclick = () => {
        const isEnabled = !toggleSwitch.classList.contains('active');
        toggleSwitch.classList.toggle('active');
        GM_setValue(CONFIG.STORAGE.SHORTCUTS_ENABLED, isEnabled);
        showToast(isEnabled ? '✅ 快捷键已启用' : '⚠️ 快捷键已禁用', isEnabled ? 'success' : 'info');
    };

    return panel;
};

// 切换快捷键帮助面板
const toggleShortcutsPanel = () => {
    let panel = document.getElementById('tme-shortcuts-panel');
    if (!panel) {
        panel = createShortcutsPanel();
    }

    overlay.classList.add('show');
    panel.classList.add('show');
};

// 全局快捷键监听
document.addEventListener('keydown', e => {
    const shortcutsEnabled = GM_getValue(CONFIG.STORAGE.SHORTCUTS_ENABLED, true);
    if (!shortcutsEnabled) return;

    // 必须同时按下 Ctrl + Alt
    if (!e.ctrlKey || !e.altKey) return;

    // 防止在输入框中触发
    const tagName = e.target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
        return;
    }

    // 获取按键（转大写）
    const key = e.key.toUpperCase();

    // 执行对应的快捷键操作
    const shortcut = SHORTCUTS_CONFIG[key];
    if (shortcut) {
        e.preventDefault();
        e.stopPropagation();

        // 直接执行操作，无弹窗提示
        shortcut.action();
    }
});

// 面板管理
const overlay = document.createElement('div');
overlay.className = 'tme-overlay';
overlay.onclick = () => {
    overlay.classList.remove('show');
    aiPanel.classList.remove('show');
    const shortcutsPanel = document.getElementById('tme-shortcuts-panel');
    if (shortcutsPanel) shortcutsPanel.classList.remove('show');
};
document.body.appendChild(overlay);

const aiPanel = document.createElement('div');
aiPanel.className = 'tme-ai-panel';
document.body.appendChild(aiPanel);

const openAIPanel = type => {
    overlay.classList.add('show');
    aiPanel.classList.add('show');

    if (type === 'search-hub') {
        aiPanel.innerHTML = createSearchHubPanel();
        initSearchHub();
    } else if (type === 'case-quick-jump') {
        aiPanel.innerHTML = createCaseJumpPanel();
        initCaseJump();
    } else if (type === 'calculator') {
        aiPanel.innerHTML = createCalcPanel();
        initCalculator(aiPanel);
    }

    aiPanel.querySelector('.tme-close-btn').onclick = () => {
        overlay.classList.remove('show');
        aiPanel.classList.remove('show');
    };
};

// 菜单配置
const menuItems = [
    {
        name: '🤖 AI Hub',
        type: 'submenu',
        subItems: [
            { name: '🎯 Transfer Case AI Assistant', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Transfer_Case_Guide/' },
            { name: '🧨 CNKR AI Library', url: 'https://quip-amazon.com/v175A7Ee2bQ5/CNKR-AI-Library' },
            { name: '💎 Amazon Quick Suite', url: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/amazonbi/start/agents' },
            { name: '✨ Kobzar', url: 'https://scenario-builder.kobzar.wwcs.amazon.dev/' },
            { name: '🎐 Party Rock', url: 'https://internal.partyrock.aws.dev/home' },
            { name: '🎄 Agent Z', url: 'https://agentz.amazon.dev/AI_Spark_Lab_Bootcamp' },
            { name: '🪁 Amazon Nova', url: 'https://atoz.amazon.work/feed/content/7f00dd40-51e7-43a7-98ae-698692eb894f' },
            { name: '🎀 Aza', url: 'https://atoz.amazon.work/aza/chat' },
            { name: '🔮 Pippin', url: 'https://pippin.sara.amazon.dev/' }
        ]
    },
    {
        name: '⛽ Rookie Gas Station',
        type: 'submenu',
        subItems: [
            { name: '🚨 Andon Cord', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Andon_Cord/' },
            { name: '💬 Chat Handling Tips', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Chat_Handling_Tips/' },
            { name: '📹 M@ Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/M@_Knowledge_Sharing' },
            { name: '🚚 FBA Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/FBA_Knowledge_Sharing' },
            { name: '✏️ IIDP Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/IIDP_Knowledge_Sharing' },
            { name: '📊 Feeds Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Feeds_Knowledge_Sharing' },
            { name: '🗺️ FFT Video & Mindmap', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/FFT_Knowledge_Sharing' },
            { name: '🌐 ILAC Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/ILAC_Knowledge_Sharing' },
            { name: '🎓 Refresh Hub', url: 'https://amazon.awsapps.com/workdocs-amazon/index.html#/folder/2425c07f9192142b77356ac1781b9631f5044d6c9d92f38a78eba5d28b405c7f' }
        ]
    },
    { name: '📚 Knowki', url: 'https://share.amazon.com/sites/knowledgesharings/_layouts/15/WopiFrame2.aspx?sourcedoc=%7Ba7424a55-cf8c-4467-ac23-7d4fe0967b30%7D&action=editnew&IsDlg=1', type: 'link' },
    { name: '🥟 Baozipu', url: 'https://w.amazon.com/bin/view/Baozipu_Project/Baozipu_List', type: 'link' },
    { name: '🔍 Search Hub', type: 'search-hub' },
    { name: '⚡ Case Quick Jump', type: 'case-quick-jump' },
    { name: '🧮 Calculator Tools', type: 'calculator' },
    { name: '🍪 Cookie Cleaner', type: 'cookie-cleaner', isCookieCleaner: true }
];

// 菜单创建
const menu = document.createElement('div');
menu.id = 'tme-menu';
menu.style.bottom = GM_getValue(CONFIG.STORAGE.MENU_BOTTOM, 50) + 'px';
menu.style.right = GM_getValue(CONFIG.STORAGE.MENU_RIGHT, 50) + 'px';

const ringContainer = document.createElement('div');
ringContainer.className = 'ring-container';

const trigger = document.createElement('div');
trigger.className = 'menu-trigger';
trigger.textContent = 'TME';

const itemsContainer = document.createElement('div');
itemsContainer.className = 'menu-items';

menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    if (item.isCookieCleaner) menuItem.classList.add('cookie-cleaner');
    if (item.type === 'submenu') menuItem.classList.add('has-submenu');
    menuItem.textContent = item.name;

    if (item.type === 'link') {
        menuItem.onclick = () => window.open(item.url, '_blank');
    } else if (item.type === 'cookie-cleaner') {
        menuItem.onclick = () => {
            menu.classList.remove('menu-open');
            clearAllCookies();
        };
    } else if (item.type === 'submenu') {
        const submenuContainer = document.createElement('div');
        submenuContainer.className = 'submenu-items';
        menuItem.onclick = e => {
            e.stopPropagation();
            document.querySelectorAll('.menu-item.has-submenu').forEach(i => {
                if (i !== menuItem) i.classList.remove('active');
            });
            menuItem.classList.toggle('active');
        };
        item.subItems.forEach(subItem => {
            const submenuItem = document.createElement('div');
            submenuItem.className = 'submenu-item';
            submenuItem.textContent = subItem.name;
            submenuItem.onclick = e => {
                e.stopPropagation();
                window.open(subItem.url, '_blank');
                menuItem.classList.remove('active');
            };
            submenuContainer.appendChild(submenuItem);
        });
        menuItem.appendChild(submenuContainer);
    } else {
        menuItem.onclick = () => {
            menu.classList.remove('menu-open');
            openAIPanel(item.type);
        };
    }
    itemsContainer.appendChild(menuItem);
});

menu.appendChild(ringContainer);
menu.appendChild(itemsContainer);
menu.appendChild(trigger);

// 拖拽功能
let isDragging = false, hasMoved = false, startX, startY, startBottom, startRight;

trigger.addEventListener('mousedown', e => {
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    const rect = menu.getBoundingClientRect();
    startBottom = window.innerHeight - rect.bottom;
    startRight = window.innerWidth - rect.right;
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        hasMoved = true;
        menu.classList.remove('menu-open');
        document.querySelectorAll('.menu-item.has-submenu').forEach(item => item.classList.remove('active'));
    }

    menu.style.right = Math.max(0, Math.min(startRight - deltaX, window.innerWidth - 60)) + 'px';
    menu.style.bottom = Math.max(0, Math.min(startBottom - deltaY, window.innerHeight - 60)) + 'px';
    e.preventDefault();
});

document.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;

    if (hasMoved) {
        const rect = menu.getBoundingClientRect();
        GM_setValue(CONFIG.STORAGE.MENU_BOTTOM, window.innerHeight - rect.bottom);
        GM_setValue(CONFIG.STORAGE.MENU_RIGHT, window.innerWidth - rect.right);
    } else {
        menu.classList.toggle('menu-open');
    }
    e.preventDefault();
});

document.addEventListener('click', e => {
    if (!menu.contains(e.target)) {
        menu.classList.remove('menu-open');
        document.querySelectorAll('.menu-item.has-submenu').forEach(item => item.classList.remove('active'));
    }
});

document.body.appendChild(menu);

console.log(`🚀 TME Assistant v${CONFIG.VERSION} loaded!`);

})();
