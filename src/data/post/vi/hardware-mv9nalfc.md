---
title: "Sửa lỗi ổ cứng ngoài không nhận và dọn sạch ổ C đầy dung lượng tại văn phòng TP.HCM"
description: "Mẹo thực chiến khắc phục nhanh lỗi ổ cứng ngoài không nhận trước giờ họp ở TP.HCM và cách dọn sạch file rác ổ C chỉ trong 3 bước."
publishDate: 2026-10-15T22:15:00.000Z
image: "/images/tech-photo/tech-photo (36).jpg"
category: "Hardware"
tags: ["PC", "Hardware", "Troubleshooting", "Windows", "Ho Chi Minh City"]
theme: "Midnight Navy Royal"
---



















Chỉ còn đúng 15 phút nữa là đến cuộc họp tổng kết dự án quý tại văn phòng ở quận 1, TP.HCM. Sếp đã ngồi sẵn trong phòng họp, máy chiếu đang chờ, và tất cả tài liệu slide thuyết trình quan trọng đều nằm trong chiếc ổ cứng di động. Tôi cắm ổ cứng vào cổng USB của máy tính, nhưng màn hình hoàn toàn im lìm. Không có tiếng *ting-tong* quen thuộc, đèn LED trên ổ cứng nhấp nháy yếu ớt rồi tắt ngấm. Ngay lúc đó, một thông báo đỏ lòm hiện lên góc màn hình: "Low Disk Space - C Drive is almost full". Ổ C đỏ rực, dung lượng trống về mức 0 byte, khiến máy tính vừa chậm như rùa vừa không thể nhận diện thêm thiết bị ngoại vi do thiếu bộ nhớ ảo và cache hệ thống. Hít một hơi thật sâu, tôi bắt đầu cuộc chiến sửa lỗi "chữa cháy" ngay trên bàn làm việc giữa cái nóng oi ả của Sài Gòn.

<div style="border-left: 4px solid #1d4ed8; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Nhật ký trực ca phần cứng:</strong> Khi ổ C đầy ứ hự (dưới 5% dung lượng trống), Windows không chỉ bị treo mà còn vô hiệu hóa các tiến trình Mount ổ đĩa ngoài do không tạo được file nhật ký tạm (temp logs). Việc đầu tiên cần làm là giải phóng ngay lập tức ít nhất 5GB đến 10GB dung lượng ảo trên ổ C trước khi nghĩ đến việc fix phần cứng.
</div>

3 nguyên nhân cốt lõi khiến ổ C đầy nghẹt và ổ cứng ngoài đột ngột "tàng hình"

Dựa trên hàng trăm ca cứu hộ máy tính văn phòng tại các tòa nhà cao ốc ở TP.HCM, tôi đúc kết ra ba thủ phạm chính gây ra cơn ác mộng này:

1. Bộ nhớ đệm tạm thời (Temp Files) phình to quá mức: Sau nhiều tháng cập nhật Windows Update, duyệt web Chrome và chạy các file Excel nặng, thư mục Temp sinh ra hàng triệu file rác chiếm trọn dung lượng ổ C.

2. Xung đột nguồn điện cổng USB (USB Root Hub Power Saving): Khi ổ C đầy, tính năng tiết kiệm năng lượng của Windows tự động ngắt nguồn điện cấp cho các cổng USB phía trước thùng máy (case) hoặc cổng thiếu ổn định, khiến ổ cứng ngoài không đủ điện để khởi động motor quay.

3. Lỗi phân vùng hoặc mất ký tự ổ đĩa (Drive Letter Conflict): Ổ cứng ngoài vẫn kết nối nhưng do xung đột phân vùng ngầm, hệ điều hành không gán được tên ổ (như ổ D, ổ E), dẫn đến việc Explorer không hiển thị.

---

3 bước thực chiến cứu nguy và dọn sạch ổ C trong 5 phút

Không cần cài thêm phần mềm bên thứ ba rườm rà, chúng ta sẽ tận dụng ngay các công cụ có sẵn trong Windows để xử lý triệt để tình huống khẩn cấp này.

Bước 1: Tổng vệ sinh file rác hệ thống bằng Storage Sense và lệnh Temp
Đừng mất thời gian xóa từng file thủ công. Hãy làm theo đường dẫn nhanh sau đây để dọn dẹp hàng gigabyte rác:
- Mở Settings(Nhấn phím Windows + I) > ChọnSystem> ChọnStorage.
- Bật tính năng Storage Sensevà bấm vàoTemporary files.
- Tích chọn vào các mục: *Windows Update Cleanup, Temporary Files, Delivery Optimization Files, và Recycle Bin*.
- Nhấn Remove files. 

Tiếp theo, để dọn tận gốc rác ẩn, nhấn tổ hợp phím Windows + R, gõ `%temp%` rồi nhấn Enter. Nhấn `Ctrl + A` để chọn tất cả các file trong thư mục này rồi nhấn `Shift + Delete` để xóa vĩnh viễn (những file nào đang chạy nền không xóa được thì chọn *Skip*). Làm tương tự với lệnh `temp` và `prefetch`.

<div style="border-left: 4px solid #1d4ed8; padding: 12px 16px; margin: 20px 0; background-color: rgba(0,0,0,0.03); border-radius: 4px; color: #111827;">
<strong>Mẹo thực chiến:</strong> Sau khi xóa xong thư mục Temp và chạy Storage Sense, dung lượng trống ổ C của tôi lập tức hồi phục từ 200MB lên đến 8.4GB. Đủ khoảng trống để hệ thống thở và bắt đầu nhận thiết bị ngoại vi.
</div>

Bước 2: Đánh thức ổ cứng ngoài thông qua Device Manager và Quản lý ổ đĩa
Ngay sau khi ổ C đã có không gian trống, việc kết nối ổ cứng ngoài sẽ trở nên khả thi hơn. Hãy thực hiện các bước sau để ép Windows nhận diện thiết bị:
- Nhấp chuột phải vào nút Start, chọn Device Manager (Quản lý thiết bị).
- Tìm đến mục Universal Serial Bus controllers, nhấp chuột phải vào từng dòng *USB Root Hub* (hoặc *Extensible Host Controller*), chọn Properties> ThẻPower Management>Bỏ tích ở ô *"Allow the computer to turn off this device to save power"*. Thao tác này đảm bảo cổng USB luôn cấp đủ điện 5V cho ổ cứng ngoài.
- Tiếp tục nhấn chuột phải vào Start, chọn Disk Management (Quản lý ổ đĩa). Kéo xuống danh sách phía dưới để tìm ổ cứng ngoài của bạn (thường hiển thị ở trạng thái *Unallocated* hoặc thiếu tên ký tự). Nhấp chuột phải vào phân vùng của ổ cứng ngoài, chọn Change Drive Letter and Paths... rồi gán cho nó một ký tự mới (ví dụ ổ Z hoặc ổ H).

Bước 3: Kiểm tra hệ thống file bằng Command Prompt (Chống lỗi Bad Sector)
Để chắc chắn ổ cứng ngoài không bị lỗi phân vùng nặng do rút đột ngột trước đó, hãy mở Command Prompt với quyền Admin (gõ `cmd` vào thanh tìm kiếm, chọn *Run as administrator*) và gõ lệnh sau:
`chkdsk X: /f /r`
*(Thay chữ X bằng ký tự ổ đĩa thực tế của ổ cứng ngoài của bạn).* Công cụ này sẽ tự động quét và sửa chữa các lỗi file hệ thống ngay lập tức.

---

Cảnh báo từ chuyên gia phần cứng

> Lưu ý quan trọng:Không bao giờ dùng các phần mềm "dọn rác tự động" trôi nổi trên mạng tải về từ các link quảng cáo khi bạn đang gặp sự cố gấp. Chúng có thể cài thêm mã độc hoặc xóa nhầm file hệ thống (System32). Luôn ưu tiên dùng công cụ gốc của Windows (`Disk Cleanup`, `Storage Sense`, `chkdsk`). Ngoài ra, với ổ cứng di động, hãy luôn thao tác tính năngSafely Remove Hardware trước khi rút cáp để tránh làm hỏng mạch điều khiển bên trong.

---

Các câu hỏi thường gặp (FAQ)

1. Tại sao tôi đã xóa hết phim và nhạc ở ổ C nhưng dung lượng trống vẫn rất ít?
Trả lời: Windows thường lưu trữ các bản vá lỗi cập nhật cũ, điểm khôi phục hệ thống (System Restore) và file ngủ đông (hiberfil.sys) ẩn sâu bên trong. Bạn cần dùng công cụ *Disk Cleanup* chọn mục *Clean up system files* để xóa sạch các bản backup Windows Update cũ, nơi thường ngốn từ 10GB đến 30GB dung lượng ổ C mà người dùng không hề hay biết.

![Hardware Diagnostic & Troubleshooting](https://picsum.photos/seed/gadget710/1000/550)

2. Ổ cứng ngoài cắm vào máy tính có đèn sáng nhưng không hiện trong My Computer thì xử lý thế nào?
Trả lời: Trường hợp này 90% là do ổ cứng chưa được gán tên ký tự ổ đĩa hoặc thiếu nguồn điện. Hãy thử cắm ổ cứng vào cổng USB ở phía sau thùng máy (kết nối trực tiếp với bo mạch chủ Mainboard thay vì cổng phía trước case) và tiến hành gán lại ký tự trong *Disk Management* như hướng dẫn ở Bước 2.

3. Có nên tắt tính năng Hibernation trên laptop để tiết kiệm dung lượng ổ C không?
Trả lời: Hoàn toàn nên nếu bạn dùng SSD dung lượng nhỏ (128GB hoặc 256GB). Tính năng Hibernation tạo ra file hiberfil.sys có dung lượng ngang bằng với lượng RAM máy bạn (ví dụ RAM 16GB thì file này chiếm đúng 16GB). Bạn có thể mở Command Prompt (Admin) và gõ lệnh `powercfg /hibernate off` để xóa vĩnh viễn file này và lấy lại không gian trống cho ổ C.
