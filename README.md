# ⚗️ Ion Blaster

Game hóa học gồm **hai chế độ**, chọn ở màn hình bắt đầu:

| Chế độ | Nội dung |
| --- | --- |
| ⚗️ **Vô cơ** | Bắn bong bóng ion, ghép thành công thức vô cơ cân bằng điện tích |
| 🧪 **Hữu cơ** | Ghép các gốc CH₃ để dựng lại toàn bộ đồng phân của một ankan, tính giờ |

# Chế độ vô cơ

Game bắn bong bóng với chủ đề hóa học vô cơ. Mỗi bong bóng là một ion; người chơi ghép các ion liền kề để tạo công thức cân bằng điện tích.

## Luật chơi

- Ngắm bằng chuột (hoặc chạm) rồi bắn ion đang nạp. Đạn có thể phản xạ vào hai thành sân.
- Không có công thức mục tiêu, băng chuyền, hay phạt vì bỏ lỡ một công thức. Người chơi được bắn tự do.
- Khi cụm chứa viên vừa bắn có đúng tỉ lệ của **bất kỳ** công thức vô cơ hợp lệ nào trong bộ ion đang chơi, cụm tự nổ và ghi điểm. Ví dụ: `Ca²⁺ + 2Cl⁻ → CaCl₂`.
- Chỉ các công thức được cân bằng điện tích và có trong dữ liệu hóa học của game mới được công nhận.
- Các bong bóng mất liên kết với hàng trần sẽ rơi xuống, cho điểm thưởng.
- Sau 10 phát chưa tạo hợp chất, hoặc theo chu kỳ thời gian, lưới tụt một hàng. Lưới chạm vạch đỏ là kết thúc ván.

## Chọn bộ ion

Trước khi chơi, chọn từ 3 đến 6 cation và 3 đến 6 anion. Danh sách công thức có thể tạo được hiển thị để tham khảo, nhưng không phải là mục tiêu bắt buộc.

Các hợp chất được tạo từ cation và anion theo tỉ lệ tối giản bằng ƯCLN, gồm axit, bazơ, muối và oxit. Các cặp không hợp lệ như `HOH` hoặc `(NH₄)₂O` được loại trừ.

# Chế độ hữu cơ — dựng đồng phân ankan

Đề bài nằm **bên phải**: một ankan bất kỳ `CₙH₂ₙ₊₂`. Bàn ghép các gốc **CH₃** nằm
**bên trái**. Nhiệm vụ là dựng lại lần lượt **mọi đồng phân** của chất đó.

## Độ khó

| Độ khó | Chất | Số đồng phân | Thời gian mỗi đồng phân |
| --- | --- | --- | --- |
| Dễ | C₄H₁₀ hoặc C₅H₁₂ | 2–3 | 30 giây |
| Trung bình | C₆H₁₄ | 5 | 45 giây |
| Khó | C₇H₁₆ | 9 | 60 giây |

Đồng hồ tính cho **từng đồng phân**: dựng đúng một đồng phân chưa từng làm thì
được điểm và đồng hồ **chạy lại từ đầu** cho đồng phân tiếp theo. Hết giờ là
thua; dựng đủ toàn bộ đồng phân là thắng. Điểm mỗi đồng phân là 100 cộng tối đa
200 điểm thưởng theo thời gian còn lại.

## Cách ghép

- Bấm ô trống cạnh mạch để nối thêm một gốc CH₃. Nguyên tử vừa đặt trở thành
  **nguyên tử đang chọn** (viền vàng) nên nối mạch thẳng chỉ tốn một cú bấm mỗi bước.
- Muốn rẽ nhánh ở chỗ khác: bấm vào nguyên tử đó để chọn, rồi bấm ô trống bên cạnh.
- Bấm lại vào nguyên tử đang chọn để **gỡ** nó ra (chỉ gỡ được nhóm CH₃ ở đầu mạch,
  nên mạch không bao giờ bị đứt làm đôi).
- Nhãn tự đổi theo số liên kết: **2 CH₃ nối chung → CH₂**, **3 → CH**, **4 → C**.
  Màu bong bóng cũng đổi theo để thấy rõ quan hệ này.
- Cacbon chỉ nhận tối đa **4 liên kết** nên không thể có 5 gốc CH₃ bao quanh —
  luật này được chặn cả ở engine lẫn ở hình học bàn chơi (mỗi ô chỉ có 4 ô kề).
- Liên kết được ghi rõ chứ không suy ra từ vị trí, nên hai nguyên tử có thể nằm
  cạnh nhau mà không nối — nhờ vậy mọi đồng phân đều vẽ vừa bàn (kể cả
  `2,2,3-trimetylbutan`, cấu trúc chật nhất của C₇H₁₆).

## Chấm bài

Đặt đủ n cacbon là hệ chấm ngay. Cấu trúc được quy về **dạng chuẩn của cây**
(thuật toán AHU từ tâm cây) nên vẽ xoay, lật hay đặt lệch chỗ nào cũng nhận đúng
một đồng phân, và không thể ăn gian bằng cách nộp lại đồng phân cũ. Tên IUPAC
tiếng Việt (`2,2-đimetylpropan`, `3-etylpentan`, …) được sinh tự động: chọn mạch
chính dài nhất, đánh số cho bộ chỉ số nhỏ nhất, rồi ghép tên nhóm thế.

# Chạy dự án

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Cấu trúc chính

- `src/game/chemistry.js`: cân bằng điện tích, tạo và phân loại công thức vô cơ.
- `src/game/engine.js`: lưới lục giác, đường đạn, phát hiện cụm hợp chất tự do, tính điểm và điều kiện thua.
- `src/game/grid.js`: hình học sân chơi.
- `src/game/render.js`: vẽ canvas.
- `src/game/organic.js`: bộ khung ankan — dạng chuẩn của cây, liệt kê đồng phân, gọi tên IUPAC.
- `src/game/organic-engine.js`: bàn ghép CH₃ (lưới vuông), luật đặt/gỡ, đồng hồ và chấm bài.
- `src/game/organic-render.js`: vẽ canvas cho chế độ hữu cơ.
- `src/components/`: giao diện React, chọn chế độ & ion, HUD, bảng ion, đề bài đồng phân, nhật ký.
- `src/game/music.js`: nhạc nền Web Audio API (dùng chung cho cả hai chế độ).
