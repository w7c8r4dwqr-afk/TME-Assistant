// ==UserScript==
// @name         TME Assistant
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  TME专属工具菜单
// @author       Hazel
// @match        https://*.amazon.com/*
// @match        https://*.amazonaws.com/*
// @match        https://*.a2z.com/*
// @match        https://*.amazon.dev/*
// @match        https://*.amazon.sharepoint.com/*
// @match        https://*.amazon.awsapps.com/*
// @match        https://*.corp.amazon.com/*
// @match        https://*.amazon.work/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
'use strict';

if (window !== window.top || document.querySelector('#tme-menu')) return;

const CONFIG = {
    VERSION: '2.2',
    COLORS: { PRIMARY: '#FF6347' },
    ANIMATION: { TOAST_DURATION: 3000 },
    STORAGE: {
        MENU_BOTTOM: 'tmeMenuBottom', MENU_RIGHT: 'tmeMenuRight',
        LAST_OU: 'tmeLastOU', LAST_TYPE: 'tmeLastType',
        LAST_DATE_TAB: 'tmeLastDateTab', LAST_CALC_TAB: 'tmeLastCalcTab',
        SEARCH_HISTORY: 'tmeSearchHistory', QUICK_JUMP_HISTORY: 'tmeQuickJumpHistory',
        SHORTCUTS_ENABLED: 'tmeShortcutsEnabled'
    },
    HISTORY: { MAX_SEARCH: 5, MAX_JUMP: 5 },
    DRAG_THRESHOLD: 5, MENU_BOUNDARY: 60, BATCH_OPEN_INTERVAL: 300, MS_PER_DAY: 86400000
};

const SEARCH_CONFIG = {
    OUS: [{ id: 'na', name: 'NA' }, { id: 'eu', name: 'EU' }, { id: 'fe', name: 'FE' }],
    TYPES: [
        { id: 'CASE',   name: 'Case',   icon: '📋', needOU: true,  platform: 'paragon' },
        { id: 'BLURB',  name: 'Blurb',  icon: '📝', needOU: true,  platform: 'paragon' },
        { id: 'SOP',    name: 'SOP',    icon: '📚', needOU: true,  platform: 'paragon' },
        { id: 'WIKI',   name: 'Wiki',   icon: '🌐', needOU: false, platform: 'wiki' },
        { id: 'TICKET', name: 'Ticket', icon: '🎫', needOU: false, platform: 'sim' }
    ],
    getDefaultOU:   () => GM_getValue(CONFIG.STORAGE.LAST_OU, 'na'),
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
.tme-cti-search-group.hidden{display:none}
.tme-cti-inline{display:flex;gap:8px;}
.tme-cti-inline input{flex:1;min-width:0;margin:0!important;}
@keyframes slideIn{from{transform:translateX(400px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(400px);opacity:0}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
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

// ── 工具函数 ──────────────────────────────────────────────────────────────────
const $id = id => document.getElementById(id);
const escapeHTML = s => String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const showToast = (msg, type = 'success') => {
    const t = document.createElement('div');
    t.className = `tme-toast ${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => t.isConnected && t.remove(), 300);
    }, CONFIG.ANIMATION.TOAST_DURATION);
};
const onEnter = (el, fn) => el?.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); fn(); } });
const isTicketID = s => /^[VDP]\d+$/i.test(s.trim()) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());
const showResult = (id, html) => { const el = $id(id); el.innerHTML = html; el.classList.add('show'); };
const manualLink = url => `<p style="margin-top:12px"><a href="${url}" target="_blank" style="color:${CONFIG.COLORS.PRIMARY};font-weight:600">👉 点击这里手动打开</a></p><p style="margin-top:12px;font-size:12px;color:#666">💡 提示：如果浏览器阻止了弹窗，请点击上方链接手动打开</p>`;

// ── HistoryManager ────────────────────────────────────────────────────────────
const HistoryManager = {
    _save(key, item, max) {
        let h = this._get(key);
        h = h.filter(x => JSON.stringify(x) !== JSON.stringify(item));
        h.unshift({ ...item, timestamp: Date.now() });
        GM_setValue(key, JSON.stringify(h.slice(0, max)));
    },
    _get(key) { try { return JSON.parse(GM_getValue(key, '[]')); } catch { return []; } },
    _del(key, i) { const h = this._get(key); h.splice(i, 1); GM_setValue(key, JSON.stringify(h)); },
    saveSearch(kw, type, ou = null) { this._save(CONFIG.STORAGE.SEARCH_HISTORY, { keyword: kw, type, ou }, CONFIG.HISTORY.MAX_SEARCH); },
    getSearchHistory()    { return this._get(CONFIG.STORAGE.SEARCH_HISTORY); },
    deleteSearchItem(i)   { this._del(CONFIG.STORAGE.SEARCH_HISTORY, i); },
    clearSearchHistory()  { GM_setValue(CONFIG.STORAGE.SEARCH_HISTORY, '[]'); },
    saveQuickJump(id, ou) { this._save(CONFIG.STORAGE.QUICK_JUMP_HISTORY, { caseId: id, ou }, CONFIG.HISTORY.MAX_JUMP); },
    getQuickJumpHistory() { return this._get(CONFIG.STORAGE.QUICK_JUMP_HISTORY); },
    deleteJumpItem(i)     { this._del(CONFIG.STORAGE.QUICK_JUMP_HISTORY, i); },
    clearJumpHistory()    { GM_setValue(CONFIG.STORAGE.QUICK_JUMP_HISTORY, '[]'); },
    formatTime(ts) {
        const d = Date.now()-ts, m = Math.floor(d/60000), h = Math.floor(d/3600000), day = Math.floor(d/CONFIG.MS_PER_DAY);
        if (m < 1) return '刚刚';
        if (m < 60) return `${m}分钟前`;
        if (h < 24) return `${h}小时前`;
        if (day < 7) return `${day}天前`;
        const dt = new Date(ts); return `${dt.getMonth()+1}/${dt.getDate()}`;
    }
};

// ── Cookie 清理 ───────────────────────────────────────────────────────────────
const clearAllCookies = () => {
    const str = document.cookie;
    if (!str?.trim()) { showToast('ℹ️ 未找到需要清除的Cookie', 'info'); return; }
    const cookies = str.split(';'), domain = location.hostname, main = domain.split('.').slice(-2).join('.');
    cookies.forEach(c => {
        const name = c.split('=')[0].trim(), exp = '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name+exp;
        document.cookie = name+exp+';domain='+domain;
        document.cookie = name+exp+';domain=.'+main;
    });
    showToast(`✅ 成功清除 ${cookies.length} 个Cookie！`, 'success');
    setTimeout(() => { showToast('🔄 即将刷新页面...', 'info'); setTimeout(() => location.reload(), 1000); }, 2000);
};

window.fetch = new Proxy(window.fetch, {
    apply: (target, thisArg, args) => {
        try {
            return target.apply(thisArg, args)
                .then(r => { if (r.status === 400) showToast('⚠️ 检测到400错误，建议清除Cookie', 'error'); return r; })
                .catch(e => { throw e; });
        } catch { return target.apply(thisArg, args); }
    }
});

// ── Calculator 面板 ───────────────────────────────────────────────────────────
const createCalcPanel = () => {
    const ld = GM_getValue(CONFIG.STORAGE.LAST_DATE_TAB, 'interval');
    const lc = GM_getValue(CONFIG.STORAGE.LAST_CALC_TAB, 'tz');
    const tab  = (id, label) => `<button class="tme-tab ${lc===id?'active':''}" data-tab="${id}">${label}</button>`;
    const dtab = (id, label) => `<button class="calc-date-tab ${ld===id?'active':''}" data-date-tab="${id}">${label}</button>`;
    const dateInput = (id, label) => `<div class="tme-input-group" style="margin-bottom:12px;"><label>${label}</label><input type="date" id="${id}"></div>`;
    return `
    <button class="tme-close-btn">×</button>
    <h2 style="display:flex;align-items:center;gap:12px;"><span style="font-size:32px;">🧮</span>Calculator Tools</h2>
    <div class="tme-tabs">${tab('tz','🌍 时区转换')}${tab('date','📅 日期计算')}${tab('text','📝 文本处理')}</div>
    <div class="tme-tab-content ${lc==='tz'?'active':''}" data-tab-content="tz">
        <div class="tme-input-group"><label>输入时间：</label>
            <div class="calc-time-input-row">
                <input type="datetime-local" id="tzInput" step="60">
                <button class="tme-btn secondary green" id="tzNow">👉 点击此处使用当前时间</button>
            </div>
        </div>
        <div class="calc-input-btn-row">
            <div class="tme-input-group"><label>选择目标时区：</label>
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
    <div class="tme-tab-content ${lc==='date'?'active':''}" data-tab-content="date">
        <div class="calc-date-tabs">${dtab('interval','📊 日期间隔')}${dtab('add','🧮 日期加减')}</div>
        <div class="calc-date-section ${ld==='interval'?'active':''}" data-date-section="interval">
            ${dateInput('dateStart','开始日期：')}${dateInput('dateEnd','结束日期：')}
            <button class="tme-btn" id="dateDiff" style="font-size:13.5px;width:100%;">🔄 计算</button>
            <div id="diffResult" class="calc-result"></div>
        </div>
        <div class="calc-date-section ${ld==='add'?'active':''}" data-date-section="add">
            ${dateInput('dateBase','基准日期：')}
            <div class="tme-input-group" style="margin-bottom:12px;"><label>天数（正数加/负数减）：</label><input type="number" id="dateDays" placeholder="例如：30 或 -15"></div>
            <button class="tme-btn" id="dateAdd" style="font-size:13.5px;width:100%;">🔄 计算</button>
            <div id="addResult" class="calc-result"></div>
        </div>
    </div>
    <div class="tme-tab-content ${lc==='text'?'active':''}" data-tab-content="text">
        <div class="tme-input-group"><label>输入文本：</label>
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
    </div>`;
};

const initCalculator = modal => {
    const $ = s => modal.querySelector(s);
    const switchTabs = (btnSel, contentAttr, dataKey, storageKey) =>
        modal.querySelectorAll(btnSel).forEach(tab => {
            tab.onclick = function() {
                const id = this.dataset[dataKey];
                modal.querySelectorAll(btnSel).forEach(t => t.classList.remove('active'));
                modal.querySelectorAll(`[${contentAttr}]`).forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                modal.querySelector(`[${contentAttr}="${id}"]`).classList.add('active');
                GM_setValue(storageKey, id);
            };
        });
    switchTabs('.tme-tab',      'data-tab-content',  'tab',     CONFIG.STORAGE.LAST_CALC_TAB);
    switchTabs('.calc-date-tab','data-date-section',  'dateTab', CONFIG.STORAGE.LAST_DATE_TAB);

    const tzInput = $('#tzInput');
    $('#tzNow').onclick = () => {
        const n = new Date();
        tzInput.value = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}T${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
    };
    $('#tzConvert').onclick = () => {
        if (!tzInput.value) return showToast('⚠️ 请输入时间', 'error');
        const zones = [['UTC','UTC'],['北京','Asia/Shanghai'],['洛杉矶','America/Los_Angeles'],['墨西哥城','America/Mexico_City'],['柏林','Europe/Berlin'],['伦敦','Europe/London'],['东京','Asia/Tokyo']];
        const date = new Date(tzInput.value), source = $('#tzSource').value, result = $('#tzResult');
        result.innerHTML = zones.map(([name, zone]) => `<div class="calc-tz-row ${zone===source?'source':''}">
            <span class="tz-name">${name}</span>
            <span class="tz-time">${date.toLocaleString('zh-CN',{timeZone:zone,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
            <span class="tz-day">${date.toLocaleString('zh-CN',{timeZone:zone,weekday:'long'})}</span>
        </div>`).join('');
        result.classList.add('show');
        showToast('✅ 转换完成', 'success');
    };

    const today = new Date().toISOString().split('T')[0];
    ['#dateStart','#dateEnd','#dateBase'].forEach(s => { const el = $(s); if (el) el.value = today; });

    $('#dateDiff').onclick = () => {
        const days = Math.ceil(Math.abs(new Date($('#dateEnd').value) - new Date($('#dateStart').value)) / CONFIG.MS_PER_DAY);
        showResult('diffResult', `<div class="calc-date-result">相差 ${days} 天</div>`);
        showToast('✅ 计算完成', 'success');
    };
    const calcDateAdd = () => {
        const days = parseInt($('#dateDays').value);
        if (!days && days !== 0) return showToast('⚠️ 请输入天数', 'error');
        const r = new Date($('#dateBase').value);
        r.setDate(r.getDate() + days);
        showResult('addResult', `<div class="calc-date-result">${r.toISOString().split('T')[0]} | ${r.toLocaleDateString('zh-CN',{weekday:'long'})}</div>`);
        showToast('✅ 计算完成', 'success');
    };
    $('#dateAdd').onclick = calcDateAdd;
    onEnter($('#dateDays'), calcDateAdd);

    const textInput = $('#textInput');
    const splitRx = /[\s,，\-\/。|;；.、\t\r\n]+/;
    const textActions = {
        'to-space':   t => ({ val: t.split(splitRx).filter(Boolean).join(' '),  msg: '✅ 已转换为空格分隔' }),
        'to-comma':   t => ({ val: t.split(splitRx).filter(Boolean).join(','),  msg: '✅ 已转换为逗号分隔' }),
        'to-newline': t => ({ val: t.split(splitRx).filter(Boolean).join('\n'), msg: '✅ 已转换为换行分隔' }),
        'dup': t => { const a = t.split(splitRx).map(l=>l.trim()).filter(Boolean), u = [...new Set(a)]; return { val: u.join('\n'), msg: `✅ 去重：${a.length} → ${u.length}` }; }
    };
    modal.querySelectorAll('[data-action]').forEach(btn => {
        btn.onclick = () => {
            const text = textInput.value;
            if (!text.trim()) return showToast('⚠️ 请输入文本', 'error');
            if (btn.dataset.action === 'cnt') {
                const stats = [['总字符',text.length],['不含空格',text.replace(/\s/g,'').length],['单词数',text.trim().split(/\s+/).filter(Boolean).length],['总行数',text.split('\n').length],['唯一行',new Set(text.split('\n').map(l=>l.trim()).filter(Boolean)).size]];
                showResult('textResult', `<div class="calc-stat-row">${stats.map(([n,v])=>`<div class="calc-stat-item"><div class="value">${v}</div><div class="label">${n}</div></div>`).join('')}</div>`);
                showToast('✅ 统计完成', 'success');
            } else {
                const r = textActions[btn.dataset.action]?.(text);
                if (r) { textInput.value = r.val; showToast(r.msg, 'success'); }
            }
        };
    });
};
// ── 面板 HTML ─────────────────────────────────────────────────────────────────
const createButtons = (items, selectedId, attr) =>
    items.map(it => `<button class="tme-type-btn ${it.id===selectedId?'active':''}" data-${attr}="${it.id}" ${it.needOU!==undefined?`data-need-ou="${it.needOU}" data-platform="${it.platform}"`:''}>${it.icon||''} ${it.name}</button>`).join('');

const createSearchHubPanel = () => {
    const ct = SEARCH_CONFIG.TYPES.find(t => t.id === selectedType);
    const isSIM = ct?.platform === 'sim';
    return `
        <button class="tme-close-btn">×</button>
        <h2>🔍 Search Hub</h2>
        <div class="tme-input-group"><label>请选择搜索类型：</label>
            <div class="tme-type-selector">${createButtons(SEARCH_CONFIG.TYPES, selectedType, 'type')}</div>
        </div>
        <div class="tme-input-group tme-ou-selector ${ct?.needOU?'':'hidden'}" id="ou-selector-group">
            <label>请选择 OU：</label>
            <div class="tme-type-selector">${createButtons(SEARCH_CONFIG.OUS, selectedOU, 'ou')}</div>
        </div>
        <div class="tme-input-group">
            <label id="tme-search-label">${isSIM?'请输入关键词或 Ticket ID：':'请输入关键词：'}</label>
            <div class="tme-input-with-button">
                <input type="text" id="tme-search-keyword" placeholder="${isSIM?'关键词 / Ticket ID':'关键词'}">
                <button class="tme-btn" id="tme-search-btn">🔍 搜索</button>
            </div>
        </div>
        <div class="tme-cti-search-group ${isSIM?'':'hidden'}" id="cti-search-group">
            <div class="tme-input-group"><label>或输入 CTI：</label>
                <div class="tme-cti-inline">
                    <input type="text" id="tme-cti-category" placeholder="Category">
                    <input type="text" id="tme-cti-type" placeholder="Type">
                    <input type="text" id="tme-cti-item" placeholder="Item">
                </div>
            </div>
        </div>
        <div id="tme-search-result"></div>
        <div id="tme-search-history-container"></div>`;
};

const createCaseJumpPanel = () => `
    <button class="tme-close-btn">×</button>
    <h2>⚡ Case Quick Jump</h2>
    <div class="tme-tabs">
        <button class="tme-tab active" data-tab="single">⚡ Single</button>
        <button class="tme-tab" data-tab="batch">📋 Multiple</button>
    </div>
    <div class="tme-tab-content active" data-tab-content="single">
        <div class="tme-input-group"><label>请选择 OU：</label>
            <div class="tme-type-selector">${createButtons(SEARCH_CONFIG.OUS, selectedOU, 'ou')}</div>
        </div>
        <div class="tme-input-group"><label>请输入 Case ID：</label>
            <div class="tme-input-with-button">
                <input type="text" id="tme-case-id" placeholder="例如：18071511111">
                <button class="tme-btn" id="tme-jump-btn">⚡ 跳转</button>
            </div>
        </div>
        <div id="tme-jump-result"></div>
        <div id="tme-jump-history-container"></div>
    </div>
    <div class="tme-tab-content" data-tab-content="batch">
        <div class="tme-input-group"><label>请选择 OU：</label>
            <div class="tme-type-selector" id="batch-ou-selector">${createButtons(SEARCH_CONFIG.OUS, selectedOU, 'ou')}</div>
        </div>
        <div class="tme-input-group"><label>请输入批量 Case ID：</label>
            <textarea id="tme-batch-case-ids" rows="6" placeholder="例如：&#10;18071511111, 18071511112&#10;18071511113 18071511114&#10;18071511115"></textarea>
            <div class="tme-hint-text">💡 支持格式：逗号、空格、换行分隔或混合使用</div>
        </div>
        <button class="tme-btn" id="tme-batch-jump-btn">📋 批量跳转</button>
        <div id="tme-batch-jump-result"></div>
    </div>`;

// ── 历史记录 ──────────────────────────────────────────────────────────────────
const renderHistory = (containerId, history, type) => {
    const container = $id(containerId);
    if (!container || !history.length) { if (container) container.innerHTML = ''; return; }
    const isSearch = type === 'search';
    const items = history.map((item, i) => {
        const time = HistoryManager.formatTime(item.timestamp);
        const del = `<button class="history-delete" data-index="${i}">×</button>`;
        if (isSearch) {
            const ti = SEARCH_CONFIG.TYPES.find(t => t.id === item.type);
            const meta = item.ou ? `${escapeHTML(item.ou.toUpperCase())} · ${escapeHTML(ti?.name||item.type)}` : escapeHTML(ti?.name||item.type);
            return `<div class="tme-history-item" data-index="${i}"><div class="history-content"><span>${ti?.icon||'🔍'}</span><strong>${escapeHTML(item.keyword)}</strong><span class="history-meta">(${meta})</span></div><span class="history-time">${time}</span>${del}</div>`;
        }
        return `<div class="tme-history-item" data-index="${i}"><div class="history-content"><strong>Case ${escapeHTML(item.caseId)}</strong><span class="history-meta">(${escapeHTML(item.ou.toUpperCase())})</span></div><span class="history-time">${time}</span>${del}</div>`;
    }).join('');
    container.innerHTML = `<div class="tme-history-section"><div class="history-header"><h3>${isSearch?'🕒 最近搜索':'🕒 最近访问'}</h3><button class="tme-btn danger" id="${isSearch?'clear-search-history-btn':'clear-jump-history-btn'}">🗑️ 清空</button></div>${items}</div>`;
    attachHistoryListeners(containerId, type);
};

const attachHistoryListeners = (containerId, type) => {
    const container = $id(containerId);
    if (!container) return;
    const isSearch = type === 'search';
    container.querySelector('.tme-btn.danger')?.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`确定要清空所有${isSearch?'搜索':'访问'}历史吗？`)) {
            isSearch ? HistoryManager.clearSearchHistory() : HistoryManager.clearJumpHistory();
            renderHistory(containerId, [], type);
            showToast(`✅ ${isSearch?'搜索':'访问'}历史已清空`, 'success');
        }
    });
    container.querySelectorAll('.tme-history-item').forEach(item => {
        item.onclick = function(e) {
            if (e.target.classList.contains('history-delete')) return;
            const idx = parseInt(this.dataset.index);
            const h = isSearch ? HistoryManager.getSearchHistory() : HistoryManager.getQuickJumpHistory();
            const hi = h[idx];
            if (isSearch && hi) {
                selectedType = hi.type;
                if (hi.ou) selectedOU = hi.ou;
                $id('tme-search-keyword').value = hi.keyword;
                document.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b.dataset.type === selectedType));
                const needOU = SEARCH_CONFIG.TYPES.find(t => t.id === selectedType)?.needOU;
                const ouGroup = $id('ou-selector-group');
                if (ouGroup) {
                    ouGroup.classList.toggle('hidden', !needOU);
                    if (needOU) document.querySelectorAll('#ou-selector-group [data-ou]').forEach(b => b.classList.toggle('active', b.dataset.ou === selectedOU));
                }
                performSearch();
            } else if (!isSearch && hi) {
                selectedOU = hi.ou;
                $id('tme-case-id').value = hi.caseId;
                document.querySelectorAll('[data-tab-content="single"] [data-ou]').forEach(b => b.classList.toggle('active', b.dataset.ou === selectedOU));
                quickJumpToCase();
            }
        };
    });
    container.querySelectorAll('.history-delete').forEach(btn => {
        btn.onclick = function(e) {
            e.stopPropagation();
            const idx = parseInt(this.dataset.index);
            isSearch ? HistoryManager.deleteSearchItem(idx) : HistoryManager.deleteJumpItem(idx);
            renderHistory(containerId, isSearch ? HistoryManager.getSearchHistory() : HistoryManager.getQuickJumpHistory(), type);
        };
    });
};

// ── Search Hub ────────────────────────────────────────────────────────────────
const setupButtonSelector = (selector, callback) =>
    document.querySelectorAll(selector).forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            callback(this);
        };
    });

let selectedOU = SEARCH_CONFIG.getDefaultOU();
let selectedType = SEARCH_CONFIG.getDefaultType();

const initSearchHub = () => {
    setupButtonSelector('[data-type]', btn => {
        selectedType = btn.dataset.type;
        const needOU = btn.dataset.needOu === 'true', isSIM = btn.dataset.platform === 'sim';
        $id('ou-selector-group').classList.toggle('hidden', !needOU);
        $id('cti-search-group').classList.toggle('hidden', !isSIM);
        const lbl = $id('tme-search-label'), inp = $id('tme-search-keyword');
        if (lbl) lbl.textContent = isSIM ? '请输入关键词或 Ticket ID：' : '请输入关键词：';
        if (inp) inp.placeholder = isSIM ? '关键词 / Ticket ID' : '关键词';
        GM_setValue(CONFIG.STORAGE.LAST_TYPE, selectedType);
    });
    setupButtonSelector('#ou-selector-group [data-ou]', btn => {
        selectedOU = btn.dataset.ou;
        GM_setValue(CONFIG.STORAGE.LAST_OU, selectedOU);
    });
    $id('tme-search-btn').onclick = performSearch;
    onEnter($id('tme-search-keyword'), performSearch);
    ['tme-cti-category','tme-cti-type','tme-cti-item'].forEach(id => onEnter($id(id), performSearch));
    renderHistory('tme-search-history-container', HistoryManager.getSearchHistory(), 'search');
};

const performSearch = () => {
    const keyword = $id('tme-search-keyword').value.trim();
    const ct = SEARCH_CONFIG.TYPES.find(t => t.id === selectedType);
    if (!ct) return;
    if (!keyword && ct.platform !== 'sim') { showToast('⚠️ 请输入搜索关键词或 ID', 'error'); return; }
    let searchUrl, info;
    if (ct.platform === 'paragon') {
        searchUrl = `https://paragon-${selectedOU}.amazon.com/hz/search?searchQuery=${encodeURIComponent(keyword)}&contentType=${selectedType}&sortField=id&sortOrder=desc#`;
        info = `<p><strong>平台：</strong>Paragon</p><p><strong>OU：</strong>${escapeHTML(selectedOU.toUpperCase())}</p><p><strong>类型：</strong>${escapeHTML(ct.name)}</p><p><strong>关键词：</strong>${escapeHTML(keyword)}</p>`;
        HistoryManager.saveSearch(keyword, selectedType, selectedOU);
    } else if (ct.platform === 'wiki') {
        searchUrl = `https://w.amazon.com/bin/view/Main/Search?q=${encodeURIComponent(keyword)}&start=1&domains=ALL`;
        info = `<p><strong>平台：</strong>Wiki</p><p><strong>关键词：</strong>${escapeHTML(keyword)}</p>`;
        HistoryManager.saveSearch(keyword, selectedType, null);
    } else {
        const c = $id('tme-cti-category')?.value.trim()||'', t = $id('tme-cti-type')?.value.trim()||'', i = $id('tme-cti-item')?.value.trim()||'';
        const hasCTI = c || t || i;

        if (keyword && isTicketID(keyword)) {
            searchUrl = `https://t.corp.amazon.com/${keyword.trim()}`;
            info = `<p><strong>平台：</strong>SIM Ticket</p><p><strong>Ticket ID：</strong>${escapeHTML(keyword)}</p><p><strong>操作：</strong>直接跳转到 Ticket</p>`;
            HistoryManager.saveSearch(keyword, selectedType, null);

        } else if (keyword && hasCTI) {
            const parts = [];
            if (c) parts.push(`extensions.tt.category%3A(%22${encodeURIComponent(c)}%22)`);
            if (t) parts.push(`extensions.tt.type%3A(%22${encodeURIComponent(t)}%22)`);
            if (i) parts.push(`extensions.tt.item%3A(%22${encodeURIComponent(i)}%22)`);
            const searchTerms = keyword.trim().split(/\s+/).join('+AND+');
            searchUrl = `https://issues.amazon.com/issues/search?q=(${searchTerms})+${parts.join('+')}&sort=createDate+desc`;
            const ctiLabel = [c&&`C: ${c}`,t&&`T: ${t}`,i&&`I: ${i}`].filter(Boolean).join(' / ');
            info = `<p><strong>平台：</strong>SIM Ticket</p><p><strong>关键词：</strong>${escapeHTML(keyword)}</p><p><strong>CTI：</strong>${escapeHTML(ctiLabel)}</p><p><strong>操作：</strong>关键词 + CTI 组合搜索</p>`;
            HistoryManager.saveSearch(`${keyword} [${ctiLabel}]`, selectedType, null);

        } else if (keyword) {
            const searchTerms = keyword.trim().split(/\s+/).join('+AND+');
            searchUrl = `https://issues.amazon.com/issues/search?q=(${searchTerms})+status%3A(Resolved)&sort=createDate+desc`;
            info = `<p><strong>平台：</strong>SIM Ticket</p><p><strong>关键词：</strong>${escapeHTML(keyword)}</p><p><strong>操作：</strong>搜索相关 SIM Ticket</p>`;
            HistoryManager.saveSearch(keyword, selectedType, null);

        } else if (hasCTI) {
            const parts = [];
            if (c) parts.push(`extensions.tt.category%3A(%22${encodeURIComponent(c)}%22)`);
            if (t) parts.push(`extensions.tt.type%3A(%22${encodeURIComponent(t)}%22)`);
            if (i) parts.push(`extensions.tt.item%3A(%22${encodeURIComponent(i)}%22)`);
            searchUrl = `https://issues.amazon.com/issues/search?q=${parts.join('+')}&sort=createDate+desc`;
            const ctiLabel = [c&&`C: ${c}`,t&&`T: ${t}`,i&&`I: ${i}`].filter(Boolean).join(' / ');
            info = `<p><strong>平台：</strong>SIM Ticket</p><p><strong>CTI：</strong>${escapeHTML(ctiLabel)}</p><p><strong>操作：</strong>按 CTI 搜索 SIM Ticket</p>`;
            HistoryManager.saveSearch(ctiLabel, selectedType, null);

        } else { showToast('⚠️ 请输入关键词、Ticket ID 或 CTI', 'error'); return; }
    }
    $id('tme-search-result').innerHTML = `<div class="tme-result-box"><h3>🔍 正在搜索...</h3>${info}<p style="margin-top:12px">正在为你打开搜索页面，请稍候...</p>${manualLink(searchUrl)}</div>`;
    renderHistory('tme-search-history-container', HistoryManager.getSearchHistory(), 'search');
    window.open(searchUrl, '_blank');
    showToast('✅ 搜索页面已打开', 'success');
};

// ── Case Jump ─────────────────────────────────────────────────────────────────
const initCaseJump = () => {
    document.querySelectorAll('.tme-tab').forEach(tab => {
        tab.onclick = function() {
            const id = this.dataset.tab;
            document.querySelectorAll('.tme-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tme-tab-content').forEach(c => c.classList.toggle('active', c.dataset.tabContent === id));
        };
    });
    const syncOU = ou => {
        selectedOU = ou;
        GM_setValue(CONFIG.STORAGE.LAST_OU, ou);
        document.querySelectorAll('[data-ou]').forEach(b => b.classList.toggle('active', b.dataset.ou === ou));
    };
    setupButtonSelector('[data-tab-content="single"] [data-ou]', btn => syncOU(btn.dataset.ou));
    setupButtonSelector('#batch-ou-selector [data-ou]', btn => syncOU(btn.dataset.ou));
    $id('tme-jump-btn').onclick = quickJumpToCase;
    onEnter($id('tme-case-id'), quickJumpToCase);
    $id('tme-batch-jump-btn').onclick = batchJumpToCases;
    renderHistory('tme-jump-history-container', HistoryManager.getQuickJumpHistory(), 'jump');
};

const quickJumpToCase = () => {
    const caseId = $id('tme-case-id').value.trim();
    if (!caseId) { showToast('⚠️ 请输入 Case ID', 'error'); return; }
    if (!/^\d+$/.test(caseId)) { showToast('⚠️ Case ID 格式不正确，请只输入数字', 'error'); return; }
    HistoryManager.saveQuickJump(caseId, selectedOU);
    const url = `https://paragon-${selectedOU}.amazon.com/hz/view-case?caseId=${caseId}`;
    $id('tme-jump-result').innerHTML = `<div class="tme-result-box"><h3>⚡ 正在跳转...</h3><p><strong>OU：</strong>${escapeHTML(selectedOU.toUpperCase())}</p><p><strong>Case ID：</strong>${escapeHTML(caseId)}</p><p style="margin-top:12px">正在为你打开 Case 页面，请稍候...</p>${manualLink(url)}</div>`;
    renderHistory('tme-jump-history-container', HistoryManager.getQuickJumpHistory(), 'jump');
    window.open(url, '_blank');
    showToast('✅ Case 页面已打开', 'success');
};

const batchJumpToCases = () => {
    const input = $id('tme-batch-case-ids').value.trim();
    if (!input) { showToast('⚠️ 请输入至少一个 Case ID', 'error'); return; }
    const ids = input.split(/[\s,\n]+/).map(s => s.trim()).filter(Boolean);
    const invalid = ids.filter(s => !/^\d+$/.test(s));
    if (invalid.length) {
        showToast(`⚠️ 发现无效的 Case ID：${invalid.join(', ')}`, 'error');
        $id('tme-batch-jump-result').innerHTML = `<div class="tme-result-box"><h3>❌ 格式错误</h3><p>以下 Case ID 格式不正确（只能包含数字）：</p><ul>${invalid.map(id=>`<li>${escapeHTML(id)}</li>`).join('')}</ul><p style="margin-top:12px">请修正后重试。</p></div>`;
        return;
    }
    const unique = [...new Set(ids)], dup = ids.length - unique.length;
    $id('tme-batch-jump-result').innerHTML = `<div class="tme-result-box"><h3>📋 批量打开中...</h3><p><strong>OU：</strong>${escapeHTML(selectedOU.toUpperCase())}</p><p><strong>Case 数量：</strong>${unique.length} 个</p>${dup?`<p><strong>已去重：</strong>${dup} 个重复项</p>`:''}<p style="margin-top:12px">正在为你打开以下 Case：</p><ul>${unique.map(id=>`<li>Case ${escapeHTML(id)}</li>`).join('')}</ul><p style="margin-top:12px;font-size:12px;color:#666">💡 提示：如果浏览器阻止了弹窗，请允许弹窗后重试</p></div>`;
    unique.forEach((id, idx) => setTimeout(() => {
        window.open(`https://paragon-${selectedOU}.amazon.com/hz/view-case?caseId=${id}`, '_blank');
        if (idx === unique.length-1) showToast(`✅ 成功打开 ${unique.length} 个 Case 标签页`, 'success');
    }, idx * CONFIG.BATCH_OPEN_INTERVAL));
};

// ── 快捷键 + 面板管理 + 菜单 + 拖拽 ─────────────────────────────────────────
const SHORTCUTS_CONFIG = {
    'S': { action: () => openAIPanel('search-hub'),      desc: '打开 Search Hub',       icon: '🔍' },
    'J': { action: () => openAIPanel('case-quick-jump'), desc: '打开 Case Quick Jump',  icon: '⚡' },
    'C': { action: () => openAIPanel('calculator'),      desc: '打开 Calculator Tools', icon: '🧮' },
    'B': { action: () => window.open('https://w.amazon.com/bin/view/Baozipu_Project/Baozipu_List','_blank'), desc: '打开 Baozipu', icon: '🥟' },
    'K': { action: () => window.open('https://share.amazon.com/sites/knowledgesharings/_layouts/15/WopiFrame2.aspx?sourcedoc=%7Ba7424a55-cf8c-4467-ac23-7d4fe0967b30%7D&action=editnew&IsDlg=1','_blank'), desc: '打开 Knowki', icon: '📚' },
    'Q': { action: () => window.open('https://us-east-1.quicksight.aws.amazon.com/sn/account/amazonbi/start/agents','_blank'), desc: '打开 Amazon Quick Suite', icon: '💎' },
    'H': { action: () => toggleShortcutsPanel(), desc: '显示快捷键帮助', icon: '❓' }
};

const overlay = document.createElement('div');
overlay.className = 'tme-overlay';
document.body.appendChild(overlay);

const aiPanel = document.createElement('div');
aiPanel.className = 'tme-ai-panel';
document.body.appendChild(aiPanel);

const closeAll = () => {
    overlay.classList.remove('show');
    aiPanel.classList.remove('show');
    $id('tme-shortcuts-panel')?.classList.remove('show');
};
overlay.onclick = closeAll;

const openAIPanel = type => {
    overlay.classList.add('show');
    aiPanel.classList.add('show');
    const panels = {
        'search-hub':      [createSearchHubPanel, initSearchHub],
        'case-quick-jump': [createCaseJumpPanel,  initCaseJump],
        'calculator':      [createCalcPanel,       p => initCalculator(p)]
    };
    const [create, init] = panels[type] || [];
    if (create) { aiPanel.innerHTML = create(); init(aiPanel); }
    aiPanel.querySelector('.tme-close-btn').onclick = closeAll;
};

const createShortcutsPanel = () => {
    const panel = document.createElement('div');
    panel.className = 'tme-shortcuts-panel';
    panel.id = 'tme-shortcuts-panel';
    const enabled = GM_getValue(CONFIG.STORAGE.SHORTCUTS_ENABLED, true);
    panel.innerHTML = `
        <button class="tme-close-btn">×</button>
        <h2><span style="font-size:28px;">⌨️</span>快捷键帮助</h2>
        <div class="shortcuts-toggle">
            <label><span style="font-size:18px;">🎯</span>启用全局快捷键</label>
            <div class="toggle-switch ${enabled?'active':''}" id="shortcuts-toggle-switch"></div>
        </div>
        <ul class="tme-shortcut-list">
            ${Object.entries(SHORTCUTS_CONFIG).map(([k,v]) => `<li class="tme-shortcut-item"><span class="shortcut-desc">${v.icon} ${v.desc}</span><div class="shortcut-keys"><span class="tme-shortcut-key">Ctrl</span><span style="color:#999">+</span><span class="tme-shortcut-key">Alt</span><span style="color:#999">+</span><span class="tme-shortcut-key">${k}</span></div></li>`).join('')}
        </ul>
        <div class="tme-shortcuts-footer">💡 提示：快捷键在输入框中不会触发，避免干扰正常输入</div>`;
    document.body.appendChild(panel);
    panel.querySelector('.tme-close-btn').onclick = () => { panel.classList.remove('show'); overlay.classList.remove('show'); };
    const sw = panel.querySelector('#shortcuts-toggle-switch');
    sw.onclick = () => {
        const on = !sw.classList.contains('active');
        sw.classList.toggle('active');
        GM_setValue(CONFIG.STORAGE.SHORTCUTS_ENABLED, on);
        showToast(on ? '✅ 快捷键已启用' : '⚠️ 快捷键已禁用', on ? 'success' : 'info');
    };
    return panel;
};

const toggleShortcutsPanel = () => {
    const panel = $id('tme-shortcuts-panel') || createShortcutsPanel();
    overlay.classList.add('show');
    panel.classList.add('show');
};

document.addEventListener('keydown', e => {
    if (!GM_getValue(CONFIG.STORAGE.SHORTCUTS_ENABLED, true) || !e.ctrlKey || !e.altKey) return;
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    const sc = SHORTCUTS_CONFIG[e.key.toUpperCase()];
    if (sc) { e.preventDefault(); e.stopPropagation(); sc.action(); }
});

// ── 菜单 ──────────────────────────────────────────────────────────────────────
const menuItems = [
    { name: '🤖 AI Hub', type: 'submenu', subItems: [
        { name: '🎯 Transfer Case AI Assistant', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Transfer_Case_Guide/' },
        { name: '🧨 CNKR AI Library', url: 'https://quip-amazon.com/v175A7Ee2bQ5/CNKR-AI-Library' },
        { name: '💎 Amazon Quick Suite', url: 'https://us-east-1.quicksight.aws.amazon.com/sn/account/amazonbi/start/agents' },
        { name: '✨ Kobzar', url: 'https://scenario-builder.kobzar.wwcs.amazon.dev/' },
        { name: '🎐 Party Rock', url: 'https://internal.partyrock.aws.dev/home' },
        { name: '🎄 Agent Z', url: 'https://agentz.amazon.dev/AI_Spark_Lab_Bootcamp' },
        { name: '🪁 Amazon Nova', url: 'https://atoz.amazon.work/feed/content/7f00dd40-51e7-43a7-98ae-698692eb894f' },
        { name: '🎀 Aza', url: 'https://atoz.amazon.work/aza/chat' },
        { name: '🔮 Pippin', url: 'https://pippin.sara.amazon.dev/' }
    ]},
    { name: '⛽ Rookie Gas Station', type: 'submenu', subItems: [
        { name: '🚨 Andon Cord', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Andon_Cord/' },
        { name: '💬 Chat Handling Tips', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Chat_Handling_Tips/' },
        { name: '📹 M@ Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/M@_Knowledge_Sharing' },
        { name: '🚚 FBA Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/FBA_Knowledge_Sharing' },
        { name: '✏️ IIDP Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/IIDP_Knowledge_Sharing' },
        { name: '📊 Feeds Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/Feeds_Knowledge_Sharing' },
        { name: '🗺️ FFT Video & Mindmap', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/FFT_Knowledge_Sharing' },
        { name: '🌐 ILAC Video', url: 'https://w.amazon.com/bin/view/Rookie_Gas_Station/ILAC_Knowledge_Sharing' },
        { name: '🎓 Refresh Hub', url: 'https://amazon.awsapps.com/workdocs-amazon/index.html#/folder/2425c07f9192142b77356ac1781b9631f5044d6c9d92f38a78eba5d28b405c7f' }
    ]},
    { name: '📚 Knowki', url: 'https://share.amazon.com/sites/knowledgesharings/_layouts/15/WopiFrame2.aspx?sourcedoc=%7Ba7424a55-cf8c-4467-ac23-7d4fe0967b30%7D&action=editnew&IsDlg=1', type: 'link' },
    { name: '🥟 Baozipu', url: 'https://w.amazon.com/bin/view/Baozipu_Project/Baozipu_List', type: 'link' },
    { name: '🔍 Search Hub', type: 'search-hub' },
    { name: '⚡ Case Quick Jump', type: 'case-quick-jump' },
    { name: '🧮 Calculator Tools', type: 'calculator' },
    { name: '🍪 Cookie Cleaner', type: 'cookie-cleaner', isCookieCleaner: true }
];

const menu = document.createElement('div');
menu.id = 'tme-menu';
menu.style.bottom = GM_getValue(CONFIG.STORAGE.MENU_BOTTOM, 50) + 'px';
menu.style.right  = GM_getValue(CONFIG.STORAGE.MENU_RIGHT,  50) + 'px';

const ringContainer = document.createElement('div');
ringContainer.className = 'ring-container';
const trigger = document.createElement('div');
trigger.className = 'menu-trigger';
trigger.textContent = 'TME';
const itemsContainer = document.createElement('div');
itemsContainer.className = 'menu-items';

menuItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'menu-item';
    if (item.isCookieCleaner) el.classList.add('cookie-cleaner');
    if (item.type === 'submenu') el.classList.add('has-submenu');
    el.textContent = item.name;
    if (item.type === 'link') {
        el.onclick = () => window.open(item.url, '_blank');
    } else if (item.type === 'cookie-cleaner') {
        el.onclick = () => { menu.classList.remove('menu-open'); clearAllCookies(); };
    } else if (item.type === 'submenu') {
        const sub = document.createElement('div');
        sub.className = 'submenu-items';
        el.onclick = e => {
            e.stopPropagation();
            document.querySelectorAll('.menu-item.has-submenu').forEach(i => { if (i !== el) i.classList.remove('active'); });
            el.classList.toggle('active');
        };
        item.subItems.forEach(si => {
            const s = document.createElement('div');
            s.className = 'submenu-item';
            s.textContent = si.name;
            s.onclick = e => { e.stopPropagation(); window.open(si.url, '_blank'); el.classList.remove('active'); };
            sub.appendChild(s);
        });
        el.appendChild(sub);
    } else {
        el.onclick = () => { menu.classList.remove('menu-open'); openAIPanel(item.type); };
    }
    itemsContainer.appendChild(el);
});

menu.appendChild(ringContainer);
menu.appendChild(itemsContainer);
menu.appendChild(trigger);

// ── 拖拽 ──────────────────────────────────────────────────────────────────────
let isDragging = false, hasMoved = false, startX, startY, startBottom, startRight;
trigger.addEventListener('mousedown', e => {
    isDragging = true; hasMoved = false;
    startX = e.clientX; startY = e.clientY;
    const r = menu.getBoundingClientRect();
    startBottom = innerHeight - r.bottom; startRight = innerWidth - r.right;
    e.preventDefault(); e.stopPropagation();
});
document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > CONFIG.DRAG_THRESHOLD || Math.abs(dy) > CONFIG.DRAG_THRESHOLD) {
        hasMoved = true;
        menu.classList.remove('menu-open');
        document.querySelectorAll('.menu-item.has-submenu').forEach(i => i.classList.remove('active'));
    }
    menu.style.right  = Math.max(0, Math.min(startRight  - dx, innerWidth  - CONFIG.MENU_BOUNDARY)) + 'px';
    menu.style.bottom = Math.max(0, Math.min(startBottom - dy, innerHeight - CONFIG.MENU_BOUNDARY)) + 'px';
    e.preventDefault();
});
document.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    if (hasMoved) {
        const r = menu.getBoundingClientRect();
        GM_setValue(CONFIG.STORAGE.MENU_BOTTOM, innerHeight - r.bottom);
        GM_setValue(CONFIG.STORAGE.MENU_RIGHT,  innerWidth  - r.right);
    } else { menu.classList.toggle('menu-open'); }
    e.preventDefault();
});
document.addEventListener('click', e => {
    if (!menu.contains(e.target)) {
        menu.classList.remove('menu-open');
        document.querySelectorAll('.menu-item.has-submenu').forEach(i => i.classList.remove('active'));
    }
});

document.body.appendChild(menu);
console.log(`🚀 TME Assistant v${CONFIG.VERSION} loaded!`);

})();
