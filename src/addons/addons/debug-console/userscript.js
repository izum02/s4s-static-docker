export default async ({ addon, console, msg }) => {
    // ページ読み込み直後にerudaを読み込む
    if (!window.eruda) {
        const script = document.createElement('script');
        script.src = 'https://soiz1-eruda3.hf.space/eruda.js';
        script.onload = () => {
            eruda.init();
        };
        document.body.appendChild(script);
    }
};
