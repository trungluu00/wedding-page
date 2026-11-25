// Ảnh nhiều cỡ: config ghi mã ảnh "p07" → <img srcset> chọn cỡ vừa đủ cho từng màn hình.
// Danh sách cỡ lấy từ photos/sizes.json (bản gọn do `npm run photos` sinh, không chứa tên file gốc).
// Giá trị không phải mã ảnh (vd "photos/abc.jpg" hoặc URL) được dùng nguyên như src.
import sizes from '../../photos/sizes.json';

/** @type {Map<string, {o: string, w: number[][]}>} */
const byId = new Map(Object.entries(sizes));
const url = (id, size) => `photos/w/${id}-${size}.webp`;

/**
 * Cột thiệp: gần hết bề ngang điện thoại / máy tính bảng dọc; từ 768px rộng tối đa 480px (.invite-col trong guest.css).
 * Khai 90vw thay vì 100vw: điện thoại màn hình nét x3 (375px → cần ~1012px) chọn bản 1600 (ảnh dọc rộng 1067px,
 * vẫn sắc nét) thay vì tải bản 2560 nặng gấp đôi. Ảnh đầu thiệp thực tế còn hẹp hơn (có lề hai bên).
 */
export const COLUMN_SIZES = '(min-width: 768px) 480px, 90vw';

export const isPhotoId = (ref) => byId.has(ref);

/**
 * Thuộc tính cho <img>: src (bản 900), srcset đủ cỡ, sizes, width/height (giữ chỗ, trang không giật khi ảnh tải xong).
 * @param {string} ref mã ảnh hoặc đường dẫn
 * @param {string} [sizesAttr]
 */
export const photoAttrs = (ref, sizesAttr = COLUMN_SIZES) => {
    const p = byId.get(ref);
    if (!p) {
        return { src: ref, 'data-full': ref };
    }
    const [size, w, h] = p.w.find((x) => x[0] === 900) ?? p.w[p.w.length - 1];
    // Bản 2560 không đưa vào srcset: điện thoại màn nét (x3) sẽ chọn nó cho ảnh rộng hết màn hình (mỗi ảnh
    // 0,5–0,9 MB). Bản 1600 đủ nét cho mọi chỗ trên thiệp; 2560 chỉ tải khi khách chạm xem ảnh lớn (data-full).
    const choices = p.w.filter((x) => x[0] < 2560);
    return {
        src: url(ref, size),
        srcset: (choices.length ? choices : p.w).map((x) => `${url(ref, x[0])} ${x[1]}w`).join(', '),
        sizes: sizesAttr,
        width: w,
        height: h,
        'data-full': url(ref, p.w[0][0]),
    };
};

/** Bản lớn nhất (2560) cho lightbox. */
export const photoFull = (ref) => {
    const p = byId.get(ref);
    return p ? url(ref, p.w[0][0]) : ref;
};

/** "doc" | "ngang" | null */
export const photoOrientation = (ref) => byId.get(ref)?.o ?? null;
