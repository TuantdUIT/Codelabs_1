import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Phải là đường dẫn tuyệt đối, không dùng './' được nữa: với BrowserRouter,
  // route lồng như /cach-choi/vo-co sẽ khiến './assets/…' trỏ nhầm sang
  // /cach-choi/assets/… và trang trắng.
  // Deploy vào thư mục con (ví dụ GitHub Pages /Codelabs_1/) thì đổi dòng này
  // thành '/Codelabs_1/' và truyền basename tương ứng cho BrowserRouter.
  base: '/',
})
