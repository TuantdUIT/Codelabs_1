# ⚗️ Ion Blaster

Một game bắn bong bóng (bubble shooter) mang chủ đề hóa học vô cơ. Thay vì ghép
màu, người chơi phải bắn đúng **ion đối nghịch điện tích** (cation ↔ anion)
vào bong bóng để trung hòa và tổng hợp thành hợp chất vô cơ thật sự — công
thức và tỉ lệ được tính đúng theo hóa trị (vd. `Ca²⁺ + 2Cl⁻ → CaCl₂`,
`Al³⁺ + 3OH⁻ → Al(OH)₃`).

## Luật chơi

- Bong bóng chứa cation hoặc anion trôi từ phải sang trái, tốc độ tăng dần.
- Chọn ion đối nghịch ở bảng phía dưới rồi bấm vào bong bóng để bắn.
- Bắn đúng loại & đủ số lượng theo hóa trị → hợp chất được tạo thành, cộng điểm.
- Bắn sai loại/ion → trừ điểm. Để bong bóng lọt qua mép trái → trừ điểm và mất mạng.
- Hết mạng → kết thúc trò chơi.

## Chạy dự án

```bash
npm install
npm run dev      # môi trường phát triển
npm run build    # build production
npm run lint     # kiểm tra lint
```

## Cấu trúc mã nguồn

- `src/game/ions.js` — cơ sở dữ liệu ion (cation/anion), điện tích, cách hiển thị ký hiệu.
- `src/game/chemistry.js` — thuật toán ghép cation + anion thành công thức hợp chất cân bằng điện tích.
- `src/game/engine.js` — logic game thuần JS (spawn, va chạm, điểm số, mạng, độ khó).
- `src/game/render.js` — vẽ khung hình lên `<canvas>`.
- `src/components/` — các thành phần giao diện React (canvas, bảng chọn ion, HUD, nhật ký hợp chất, màn hình bắt đầu/kết thúc).
