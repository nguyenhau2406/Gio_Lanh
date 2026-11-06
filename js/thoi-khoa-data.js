/* Gió Lành — Dữ liệu thời khóa tụng niệm có hướng dẫn.
   Lời tụng dùng bản phiên âm Hán Việt truyền thống; dòng "nghĩa" là diễn ý tiếng Việt do Gió Lành biên soạn.
   Các loại bước:
     bell    — thỉnh chuông lớn: {strikes, gap(giây)}
     guide   — lời hướng dẫn, đọc thầm: {text, seconds}
     breath  — ngồi yên theo dõi hơi thở: {seconds}
     chant   — tụng theo mõ, mỗi tiếng mõ một chữ: {lines:[[câu, nghĩa?]], repeat?, lastRepeat?}
               repeat: số lần tụng cả đoạn; lastRepeat: chỉ lặp dòng cuối (ví dụ câu chú) */
window.GioThoiKhoaParts = {
  chuongMo: { type: 'bell', title: 'Thỉnh chuông khai thời khóa', strikes: 3, gap: 7, note: 'Lắng nghe trọn vẹn tiếng chuông. Mỗi tiếng chuông, thở vào và thở ra một lần.' },
  chuongKet: { type: 'bell', title: 'Chuông kết thúc', strikes: 3, gap: 6, note: 'Ngồi yên thêm giây lát, mỉm cười với thời khóa vừa xong.' },
  ngoiYen: { type: 'guide', title: 'Chuẩn bị', seconds: 20, text: 'Ngồi thẳng lưng, vai thả lỏng. Chắp tay trước ngực. Hướng tâm về Tam Bảo và về những người mình thương.' },
  hoiTho1: { type: 'breath', title: 'Trở về hơi thở', seconds: 60 },
  hoiTho2: { type: 'breath', title: 'Trở về hơi thở', seconds: 120 },
  tanPhat: { type: 'chant', title: 'Niệm danh hiệu Bổn Sư', lines: [['Nam mô Bổn Sư Thích Ca Mâu Ni Phật.', 'Kính lễ đức Thầy của chúng con, Phật Thích Ca Mâu Ni.']], repeat: 3 },
  tamKinh: { type: 'chant', title: 'Bát Nhã Ba La Mật Đa Tâm Kinh', lines: [
    ['Ma Ha Bát Nhã Ba La Mật Đa Tâm Kinh.', 'Kinh tinh yếu về trí tuệ vượt qua bờ mê.'],
    ['Quán Tự Tại Bồ Tát hành thâm Bát Nhã Ba La Mật Đa thời, chiếu kiến ngũ uẩn giai không, độ nhất thiết khổ ách.', 'Bồ Tát Quán Tự Tại khi thực hành sâu trí tuệ ấy, soi thấy năm uẩn đều không, vượt qua mọi khổ ách.'],
    ['Xá Lợi Tử, sắc bất dị không, không bất dị sắc, sắc tức thị không, không tức thị sắc, thọ tưởng hành thức diệc phục như thị.', 'Này Xá Lợi Tử, sắc chẳng khác không, không chẳng khác sắc; thọ, tưởng, hành, thức cũng đều như vậy.'],
    ['Xá Lợi Tử, thị chư pháp không tướng, bất sanh bất diệt, bất cấu bất tịnh, bất tăng bất giảm.', 'Tướng không của các pháp: không sinh không diệt, không nhơ không sạch, không thêm không bớt.'],
    ['Thị cố không trung vô sắc, vô thọ tưởng hành thức, vô nhãn nhĩ tỷ thiệt thân ý, vô sắc thanh hương vị xúc pháp, vô nhãn giới nãi chí vô ý thức giới,', 'Vì vậy trong tánh không chẳng có sắc, thọ, tưởng, hành, thức; chẳng có sáu căn, sáu trần, mười tám giới.'],
    ['vô vô minh diệc vô vô minh tận, nãi chí vô lão tử diệc vô lão tử tận, vô khổ tập diệt đạo, vô trí diệc vô đắc.', 'Chẳng có vô minh cũng chẳng có hết vô minh, cho đến chẳng có già chết cũng chẳng có hết già chết; chẳng có khổ, tập, diệt, đạo; chẳng có trí cũng chẳng có đắc.'],
    ['Dĩ vô sở đắc cố, Bồ Đề Tát Đỏa y Bát Nhã Ba La Mật Đa cố, tâm vô quái ngại, vô quái ngại cố, vô hữu khủng bố, viễn ly điên đảo mộng tưởng, cứu cánh Niết Bàn.', 'Vì không có gì để đắc, Bồ Tát nương trí tuệ ấy nên tâm không vướng mắc, không sợ hãi, xa lìa mộng tưởng điên đảo, đạt đến Niết Bàn.'],
    ['Tam thế chư Phật y Bát Nhã Ba La Mật Đa cố, đắc A Nậu Đa La Tam Miệu Tam Bồ Đề.', 'Chư Phật ba đời nương trí tuệ ấy mà thành tựu giác ngộ viên mãn.'],
    ['Cố tri Bát Nhã Ba La Mật Đa thị đại thần chú, thị đại minh chú, thị vô thượng chú, thị vô đẳng đẳng chú, năng trừ nhất thiết khổ, chân thật bất hư.', 'Nên biết trí tuệ ấy là thần chú lớn, sáng lớn, cao tột, không gì sánh bằng, trừ được mọi khổ, chân thật không hư dối.'],
    ['Cố thuyết Bát Nhã Ba La Mật Đa chú, tức thuyết chú viết:', 'Vì vậy nói câu chú Bát Nhã:'],
    ['Yết đế yết đế, ba la yết đế, ba la tăng yết đế, bồ đề tát bà ha.', 'Đi qua, đi qua, đi qua bờ bên kia, tất cả cùng qua — giác ngộ, an lành.'],
  ], lastRepeat: 3 },
  samHoi: { type: 'chant', title: 'Kệ Sám Hối', lines: [
    ['Vãng tích sở tạo chư ác nghiệp,', 'Bao nhiêu nghiệp ác con đã tạo từ trước,'],
    ['giai do vô thủy tham sân si,', 'đều do tham, sân, si từ vô thủy,'],
    ['tùng thân ngữ ý chi sở sanh,', 'phát sinh từ thân, lời nói và ý nghĩ,'],
    ['nhất thiết ngã kim giai sám hối.', 'nay con xin thành tâm sám hối tất cả.'],
  ], repeat: 1 },
  niemDiDa: { type: 'chant', title: 'Niệm Phật A Di Đà', lines: [['Nam mô A Di Đà Phật.', 'Quy kính đức Phật Vô Lượng Quang, Vô Lượng Thọ.']], repeat: 10 },
  niemQuanAm: { type: 'chant', title: 'Niệm Bồ Tát Quán Thế Âm', lines: [['Nam mô Đại Bi Quán Thế Âm Bồ Tát.', 'Quy kính Bồ Tát Quán Thế Âm, người lắng nghe tiếng kêu thương của cuộc đời.']], repeat: 3 },
  tamQuy: { type: 'chant', title: 'Tam Tự Quy Y', lines: [
    ['Tự quy y Phật, đương nguyện chúng sanh, thể giải đại đạo, phát vô thượng tâm.', 'Con về nương Phật, nguyện cho mọi người hiểu thấu đạo lớn, phát tâm cao thượng.'],
    ['Tự quy y Pháp, đương nguyện chúng sanh, thâm nhập kinh tạng, trí huệ như hải.', 'Con về nương Pháp, nguyện cho mọi người thấm sâu kinh tạng, trí tuệ như biển.'],
    ['Tự quy y Tăng, đương nguyện chúng sanh, thống lý đại chúng, nhất thiết vô ngại.', 'Con về nương Tăng, nguyện cho mọi người hòa hợp đại chúng, không còn chướng ngại.'],
  ], repeat: 1 },
  hoiHuong: { type: 'chant', title: 'Hồi Hướng', lines: [
    ['Nguyện dĩ thử công đức,', 'Nguyện đem công đức này,'],
    ['phổ cập ư nhất thiết,', 'hướng về khắp tất cả,'],
    ['ngã đẳng dữ chúng sanh,', 'chúng con và chúng sinh,'],
    ['giai cộng thành Phật đạo.', 'đều trọn thành Phật đạo.'],
  ], repeat: 1 },
  phatNguyenSang: { type: 'guide', title: 'Phát nguyện đầu ngày', seconds: 30, text: 'Hôm nay con nguyện nói lời chân thật, làm việc thiện lành, giữ tâm ý sáng trong. Nguyện không làm tổn hại ai, và học cách hiểu, cách thương nhiều hơn.' },
  nhinLaiToi: { type: 'guide', title: 'Nhìn lại một ngày', seconds: 45, text: 'Nhẹ nhàng nhìn lại ngày đã qua. Điều thiện đã làm, xin trân trọng và tiếp tục. Điều chưa khéo, xin nhận biết, không trách móc, và nguyện sửa đổi ngày mai.' },
};

window.GioThoiKhoa = [
  { id: 'ngan', name: 'Thời khóa ngắn', when: 'Bất cứ lúc nào', icon: '❀', desc: 'Một khoảng lặng gọn gàng giữa ngày: hơi thở, Tâm Kinh và hồi hướng.',
    steps: ['chuongMo', 'hoiTho1', 'tamKinh', 'hoiHuong', 'chuongKet'] },
  { id: 'sang', name: 'Thời khóa sáng', when: 'Khởi đầu ngày mới', icon: '☀', desc: 'Quy hướng Tam Bảo, tụng Tâm Kinh, niệm Quán Thế Âm và phát nguyện cho một ngày an lành.',
    steps: ['chuongMo', 'ngoiYen', 'hoiTho1', 'tanPhat', 'tamKinh', 'niemQuanAm', 'tamQuy', 'phatNguyenSang', 'hoiHuong', 'chuongKet'] },
  { id: 'toi', name: 'Thời khóa tối', when: 'Trước khi nghỉ ngơi', icon: '☾', desc: 'Nhìn lại ngày qua, sám hối, niệm Phật A Di Đà và hồi hướng trong tĩnh lặng.',
    steps: ['chuongMo', 'ngoiYen', 'hoiTho2', 'tanPhat', 'nhinLaiToi', 'samHoi', 'tamKinh', 'niemDiDa', 'tamQuy', 'hoiHuong', 'chuongKet'] },
];
