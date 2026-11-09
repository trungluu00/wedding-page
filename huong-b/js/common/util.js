// Tiện ích chung — rút gọn từ js/common/util.js của dewanakl/undangan v3.14.0.
// Khác bản gốc: thông báo bằng toast tiếng Việt thay cho alert(), chép có phương án dự phòng
// cho trình duyệt trong Zalo/Messenger, thêm h() dựng phần tử an toàn (chuỗi luôn đi qua textContent).

export const util = (() => {

    const loader = '<span class="spinner-border spinner-border-sm my-0 ms-0 me-1 p-0" style="height: 0.8rem; width: 0.8rem;"></span>';

    /**
     * Dựng phần tử DOM. Con là chuỗi → textNode (không bao giờ thành HTML).
     * @param {string} tag
     * @param {Object<string, any>|null} [attrs]
     * @param  {...any} children
     * @returns {HTMLElement}
     */
    const h = (tag, attrs = null, ...children) => {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs ?? {})) {
            if (v === null || v === undefined || v === false) {
                continue;
            }
            if (k === 'class') {
                el.className = v;
            } else if (k === 'style' && typeof v === 'object') {
                Object.assign(el.style, v);
            } else if (k === 'text') {
                el.textContent = v;
            } else if (k.startsWith('on') && typeof v === 'function') {
                el.addEventListener(k.slice(2), v);
            } else {
                el.setAttribute(k, v === true ? '' : String(v));
            }
        }
        for (const c of children.flat(Infinity)) {
            if (c === null || c === undefined || c === false) {
                continue;
            }
            el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
        }
        return el;
    };

    /**
     * @param {string} name tên icon Font Awesome, vd "fa-ring"
     * @param {string} [extra]
     * @returns {HTMLElement}
     */
    const icon = (name, extra = '') => h('i', { class: `fa-solid ${name} ${extra}`.trim(), 'aria-hidden': 'true' });

    /**
     * @param {string} message
     * @param {'success'|'error'|'info'} [type]
     * @returns {void}
     */
    const toast = (message, type = 'info') => {
        const zone = document.getElementById('toast-zone');
        if (!zone) {
            window.alert(message);
            return;
        }
        const el = h('div', { class: `toast-c ${type === 'error' ? 'toast-error' : ''}`, role: 'status' }, message);
        zone.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 350);
        }, type === 'error' ? 4500 : 2800);
    };

    const notify = (message) => ({
        success: () => toast(message, 'success'),
        error: () => toast(message, 'error'),
        info: () => toast(message, 'info'),
        warning: () => toast(message, 'info'),
    });

    /**
     * Hiện/ẩn dần. Tính theo thời gian thực (không theo số khung hình) để máy yếu hoặc
     * webview bị hãm requestAnimationFrame vẫn xong đúng hạn; có setTimeout dự phòng.
     * @param {HTMLElement} el
     * @param {boolean} isUp
     * @param {number} [duration=400] ms
     * @returns {Promise<HTMLElement>}
     */
    const changeOpacity = (el, isUp, duration = 400) => new Promise((res) => {
        let from = parseFloat(el.style.opacity);
        if (Number.isNaN(from)) {
            from = isUp ? 0 : 1;
        }
        const target = isUp ? 1 : 0;
        const start = Date.now();
        let done = false;

        const finish = () => {
            if (done) {
                return;
            }
            done = true;
            el.style.opacity = target.toString();
            res(el);
        };

        const animate = () => {
            if (done) {
                return;
            }
            const t = Math.min(1, (Date.now() - start) / duration);
            el.style.opacity = (from + (target - from) * t).toFixed(2);
            if (t >= 1) {
                finish();
            } else {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
        setTimeout(finish, duration + 250);
    });

    /**
     * @param {function} callback
     * @param {number} [delay=0]
     */
    const timeOut = (callback, delay = 0) => setTimeout(callback, delay);

    /**
     * @param {function} callback
     * @param {number} [delay=100]
     * @returns {function}
     */
    const debounce = (callback, delay = 100) => {
        let timeout = null;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => callback(...args), delay);
        };
    };

    /**
     * @param {HTMLButtonElement} button
     * @param {string} [message]
     * @returns {{restore: function}}
     */
    const disableButton = (button, message = 'Đang gửi...') => {
        button.disabled = true;
        const tmp = Array.from(button.childNodes);
        button.replaceChildren(document.createRange().createContextualFragment(loader), document.createTextNode(message));

        return {
            restore: (disabled = false) => {
                button.replaceChildren(...tmp);
                button.disabled = disabled;
            },
        };
    };

    /**
     * Chép chữ vào bộ nhớ tạm. Trình duyệt trong app (Zalo...) đôi khi chặn navigator.clipboard
     * nên có thêm cách cũ bằng textarea + execCommand.
     * @param {string} text
     * @returns {Promise<boolean>}
     */
    const copyText = async (text) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch {
            // thử cách dưới
        }
        try {
            const ta = h('textarea', { readonly: true, style: { position: 'fixed', top: '-1000px', opacity: '0' } });
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, text.length);
            const ok = document.execCommand('copy');
            ta.remove();
            return ok;
        } catch {
            return false;
        }
    };

    /**
     * @param {HTMLButtonElement} button nút có data-copy
     * @param {number} [timeout=1500]
     * @returns {Promise<void>}
     */
    const copy = async (button, timeout = 1500) => {
        const data = button.getAttribute('data-copy');
        if (!data) {
            return;
        }
        button.disabled = true;
        const ok = await copyText(data);
        if (!ok) {
            button.disabled = false;
            notify(`Không chép được, bạn hãy chép tay: ${data}`).error();
            return;
        }
        const tmp = Array.from(button.childNodes);
        button.replaceChildren(icon('fa-check', 'me-1'), 'Đã chép');
        notify('Đã chép số tài khoản').success();
        setTimeout(() => {
            button.disabled = false;
            button.replaceChildren(...tmp);
        }, timeout);
    };

    /**
     * Bỏ dấu tiếng Việt (dùng cho nội dung chuyển khoản VietQR).
     * @param {string} s
     * @returns {string}
     */
    const removeDiacritics = (s) => String(s ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');

    return {
        h,
        icon,
        copy,
        copyText,
        toast,
        notify,
        timeOut,
        debounce,
        disableButton,
        changeOpacity,
        removeDiacritics,
    };
})();
