/* ============================================
   LCARS Storage — localStorage management
   Autosave, welcome state, recent layouts,
   tab locking with heartbeat.
   ============================================ */

const LCARSStorage = (() => {
    'use strict';

    const KEYS = {
        WELCOMED: 'lcars-welcomed',
        AUTOSAVE: 'lcars-autosave',
        RECENT: 'lcars-recent',
        TAB_LOCK: 'lcars-editor-lock',
    };

    const SCHEMA_VERSION = 1;
    const MAX_RECENT = 20;
    const LOCK_STALE_MS = 30000; // 30s — lock considered stale
    const HEARTBEAT_MS = 10000;  // 10s — heartbeat interval

    const TAB_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

    let heartbeatInterval = null;
    let autosaveTimer = null;

    // ── Safe localStorage wrappers ──

    function safeGet(key) {
        try { return localStorage.getItem(key); }
        catch { return null; }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('LCARS Storage: localStorage quota exceeded for key:', key);
            }
            return false;
        }
    }

    function safeRemove(key) {
        try { localStorage.removeItem(key); }
        catch { /* ignore */ }
    }

    // ── Welcome ──

    function hasSeenWelcome() {
        return safeGet(KEYS.WELCOMED) === '1';
    }

    function markWelcomeSeen() {
        safeSet(KEYS.WELCOMED, '1');
    }

    // ── Autosave (1-second debounce) ──

    function scheduleAutosave(getLayoutFn) {
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => {
            const layout = getLayoutFn();
            const data = {
                version: SCHEMA_VERSION,
                timestamp: Date.now(),
                layout: layout,
            };
            const ok = safeSet(KEYS.AUTOSAVE, JSON.stringify(data));
            if (!ok) {
                console.warn('LCARS Storage: autosave failed (quota?)');
            }
        }, 1000);
    }

    function loadAutosave() {
        const raw = safeGet(KEYS.AUTOSAVE);
        if (!raw) return null;
        try {
            const data = JSON.parse(raw);
            if (data.version !== SCHEMA_VERSION) {
                console.warn('LCARS Storage: autosave schema v' + data.version + ' !== v' + SCHEMA_VERSION + ', discarding');
                safeRemove(KEYS.AUTOSAVE);
                return null;
            }
            return data;
        } catch {
            safeRemove(KEYS.AUTOSAVE);
            return null;
        }
    }

    function clearAutosave() {
        clearTimeout(autosaveTimer);
        safeRemove(KEYS.AUTOSAVE);
    }

    function hasAutosave() {
        const raw = safeGet(KEYS.AUTOSAVE);
        if (!raw) return false;
        try {
            const data = JSON.parse(raw);
            return data && data.layout && data.layout.elements && data.layout.elements.length > 0;
        } catch { return false; }
    }

    // ── Recent Layouts ──

    function getRecent() {
        const raw = safeGet(KEYS.RECENT);
        if (!raw) return [];
        try { return JSON.parse(raw); }
        catch { return []; }
    }

    function addRecent(entry) {
        let recent = getRecent();
        recent = recent.filter(r => r.id !== entry.id);
        recent.unshift({
            id: entry.id,
            timestamp: entry.timestamp || Date.now(),
            elementCount: entry.elementCount || 0,
            displaySize: entry.displaySize || '?',
        });
        if (recent.length > MAX_RECENT) recent = recent.slice(0, MAX_RECENT);
        safeSet(KEYS.RECENT, JSON.stringify(recent));
    }

    function removeRecent(id) {
        let recent = getRecent();
        recent = recent.filter(r => r.id !== id);
        safeSet(KEYS.RECENT, JSON.stringify(recent));
    }

    function clearRecent() {
        safeRemove(KEYS.RECENT);
    }

    // ── Tab Locking ──

    function acquireLock() {
        const existing = safeGet(KEYS.TAB_LOCK);
        if (existing) {
            try {
                const lock = JSON.parse(existing);
                if (lock.tabId !== TAB_ID && (Date.now() - lock.timestamp) < LOCK_STALE_MS) {
                    return false; // Another tab holds a fresh lock
                }
            } catch { /* corrupt lock — claim it */ }
        }
        const lock = { tabId: TAB_ID, timestamp: Date.now() };
        safeSet(KEYS.TAB_LOCK, JSON.stringify(lock));
        _startHeartbeat();
        return true;
    }

    function forceAcquireLock() {
        const lock = { tabId: TAB_ID, timestamp: Date.now() };
        safeSet(KEYS.TAB_LOCK, JSON.stringify(lock));
        _startHeartbeat();
    }

    function releaseLock() {
        const existing = safeGet(KEYS.TAB_LOCK);
        if (existing) {
            try {
                const lock = JSON.parse(existing);
                if (lock.tabId === TAB_ID) {
                    safeRemove(KEYS.TAB_LOCK);
                }
            } catch {
                safeRemove(KEYS.TAB_LOCK);
            }
        }
        _stopHeartbeat();
    }

    function hasLock() {
        const existing = safeGet(KEYS.TAB_LOCK);
        if (!existing) return true; // No lock = free
        try {
            const lock = JSON.parse(existing);
            return lock.tabId === TAB_ID;
        } catch { return true; }
    }

    function isLockedByOther() {
        const existing = safeGet(KEYS.TAB_LOCK);
        if (!existing) return false;
        try {
            const lock = JSON.parse(existing);
            if (lock.tabId === TAB_ID) return false;
            return (Date.now() - lock.timestamp) < LOCK_STALE_MS;
        } catch { return false; }
    }

    function _startHeartbeat() {
        _stopHeartbeat();
        heartbeatInterval = setInterval(() => {
            const lock = { tabId: TAB_ID, timestamp: Date.now() };
            safeSet(KEYS.TAB_LOCK, JSON.stringify(lock));
        }, HEARTBEAT_MS);
    }

    function _stopHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }

    // Release lock on page unload
    window.addEventListener('beforeunload', releaseLock);

    // ── Public API ──

    return {
        SCHEMA_VERSION,
        TAB_ID,
        KEYS,
        // Welcome
        hasSeenWelcome,
        markWelcomeSeen,
        // Autosave
        scheduleAutosave,
        loadAutosave,
        clearAutosave,
        hasAutosave,
        // Recent
        getRecent,
        addRecent,
        removeRecent,
        clearRecent,
        // Tab lock
        acquireLock,
        forceAcquireLock,
        releaseLock,
        hasLock,
        isLockedByOther,
    };
})();
