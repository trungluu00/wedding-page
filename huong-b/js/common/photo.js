// Ảnh nhiều cỡ: config ghi mã ảnh "p07" → <img srcset> chọn cỡ vừa đủ cho từng màn hình.
// Danh sách cỡ lấy từ photos/sizes.json (bản gọn do `npm run photos` sinh, không chứa tên file gốc).
// Giá trị không phải mã ảnh (vd "photos/abc.jpg" hoặc URL) được dùng nguyên như src.
import sizes from '../../photos/sizes.json';

/** @type {Map<string, {o: string, w: number[][]}>} */
const byId = new Map(Object.entries(sizes));
const url = (id, size) => `photos/w/${id}-${size}.webp`;

/** Cột thiệp: 100% màn hình điện thoại, hẹp dần trên màn hình lớn (khớp lưới Bootstrap trong index.html). */
export const COLUMN_SIZES = '(min-width: 1400px) 25vw, (min-width: 1200px) 33vw, (min-width: 992px) 42vw, (min-width: 768px) 50vw, (min-width: 576px) 58vw, 100vw';

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
    return {
        src: url(ref, size),
        srcset: p.w.map((x) => `${url(ref, x[0])} ${x[1]}w`).join(', '),
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
