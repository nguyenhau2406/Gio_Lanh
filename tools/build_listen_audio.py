# -*- coding: utf-8 -*-
"""Gió Lành 7.15 — Biên soạn & tạo giọng đọc cho mục "Thư viện nghe kinh".

Nguồn duy nhất của lời đọc. Chạy:
    pip install edge-tts
    python tools/build_listen_audio.py            # tạo lại tất cả
    python tools/build_listen_audio.py tu-bi      # chỉ một bài

Kết quả:
    assets/audio/nghe-kinh/<id>.mp3   — giọng đọc tiếng Việt (Microsoft Neural, tổng hợp)
    js/listen-data-v7-15.js           — lời đọc, mốc thời gian từng câu, thời lượng

Lời đọc là DIỄN Ý do Gió Lành biên soạn để dễ suy ngẫm, không phải nguyên văn bản dịch kinh.
"""
import asyncio, json, pathlib, re, sys
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_AUDIO = ROOT / "assets" / "audio" / "nghe-kinh"
OUT_JS = ROOT / "js" / "listen-data-v7-15.js"
VOICE = "vi-VN-HoaiMyNeural"
RATE = "-10%"
PITCH = "-2Hz"

INTRO = "Đây là lời diễn ý do Gió Lành biên soạn để dễ lắng nghe và suy ngẫm, không phải nguyên văn bản dịch kinh."
OUTRO = "Nguyện cho bạn, cho những người bạn thương và cho tất cả mọi loài được bình an."

LISTEN = [
 {
  "id": "tu-bi", "title": "Kinh Từ Bi", "pali": "Karaṇīya Mettā Sutta · Kinh Tập 1.8",
  "tag": "Nuôi dưỡng yêu thương", "image": "assets/sutra-tu-bi.jpg",
  "source": "https://suttacentral.net/snp1.8/vi/minh_chau",
  "summary": "Những phẩm chất của người muốn sống an tịnh và cách mở rộng tâm từ đến mọi loài, như người mẹ thương đứa con một.",
  "chapters": [
   ("Mở đầu", [
     "Gió Lành kính mời bạn cùng lắng nghe phần diễn ý Kinh Từ Bi, một bài kinh ngắn trong Kinh Tập, được tụng đọc rất phổ biến ở nhiều truyền thống. " + INTRO,
   ]),
   ("Nền tảng của lòng từ", [
     "Bài kinh mở đầu bằng chân dung của một người muốn sống trong an tịnh. Người ấy có khả năng, ngay thẳng và chân thật. Người ấy dễ khuyên bảo, hiền hòa, không kiêu mạn.",
     "Người ấy biết đủ, dễ nuôi, ít bận rộn, sống giản dị. Các giác quan được lắng dịu, tâm sáng suốt, không xấc xược, không bám víu. Người ấy không làm dù chỉ một việc nhỏ mà người hiểu biết có thể chê trách.",
     "Như vậy, lòng từ không bắt đầu từ lời nói hay. Lòng từ được đặt trên một đời sống trong sạch, khiêm tốn và nhẹ nhàng.",
   ]),
   ("Mở rộng tâm từ", [
     "Rồi người ấy khởi lên ước nguyện: mong cho tất cả chúng sinh được an vui, được yên ổn, được hạnh phúc.",
     "Dù yếu hay mạnh, lớn hay nhỏ, dài hay ngắn, thô hay tế. Dù thấy được hay không thấy được, ở gần hay ở xa. Dù đã sinh ra hay đang tìm về sự sống. Mong tất cả đều được an vui.",
     "Mong không ai lừa dối ai, không ai coi thường ai ở bất cứ nơi đâu. Mong không ai vì giận dữ hay ác ý mà muốn người khác phải khổ đau.",
   ]),
   ("Như mẹ thương con", [
     "Kinh dạy một hình ảnh rất đẹp. Như người mẹ sẵn lòng che chở đứa con một của mình, dù phải đánh đổi cả mạng sống, ta hãy nuôi dưỡng một tâm thương không giới hạn đối với mọi loài.",
     "Tâm từ ấy lan tỏa lên trên, xuống dưới và khắp bốn phương. Không ngăn ngại, không oán giận, không thù địch.",
     "Khi đứng, khi đi, khi ngồi hay khi nằm, lúc nào còn tỉnh thức, hãy giữ vững niệm từ bi này. Kinh gọi đó là cách sống cao thượng ngay trong đời này.",
     "Người như vậy không rơi vào tà kiến, giữ gìn giới hạnh, có cái thấy sáng tỏ, và dần buông được sự đắm say dục lạc.",
   ]),
   ("Thực tập", [
     "Bây giờ, mời bạn ngồi yên và thở nhẹ vài hơi. Thầm nhắc với chính mình: mong tôi được bình an, mong tôi được nhẹ lòng.",
     "Rồi nghĩ đến một người thân và gửi đến họ: mong bạn được bình an. Sau đó, nghĩ đến một người bạn còn khó hiểu, và cũng gửi đến họ lời chúc ấy.",
     "Cuối cùng, để lòng mình rộng ra như bầu trời: mong tất cả mọi loài được an vui. " + OUTRO,
   ]),
  ],
 },
 {
  "id": "phap-cu", "title": "Kinh Pháp Cú", "pali": "Dhammapada · Tiểu Bộ Kinh",
  "tag": "Lời dạy căn bản", "image": "assets/sutra-phap-cu.jpg",
  "source": "https://suttacentral.net/dhp",
  "summary": "Năm ý kệ cốt lõi về tâm ý, hận thù, sự tự thắng, tỉnh thức và lời dạy chung của chư Phật.",
  "chapters": [
   ("Mở đầu", [
     "Gió Lành kính mời bạn cùng lắng nghe phần diễn ý Kinh Pháp Cú. Kinh gồm bốn trăm hai mươi ba bài kệ ngắn, như những hạt ngọc nhỏ để mang theo trong đời sống hằng ngày. " + INTRO,
   ]),
   ("Tâm dẫn đầu", [
     "Những câu kệ đầu tiên dạy rằng tâm ý dẫn đầu mọi việc. Tâm là chủ, tâm tạo tác tất cả.",
     "Nếu nói và làm với một tâm ô nhiễm, khổ đau sẽ theo sau, như bánh xe lăn theo dấu chân con vật kéo xe. Nếu nói và làm với một tâm trong sáng, an vui sẽ theo sau, như bóng không rời hình.",
     "Vì vậy, chăm sóc tâm ý chính là chăm sóc con đường mình đang đi.",
   ]),
   ("Hận thù và tình thương", [
     "Một bài kệ khác dạy: ở đời, hận thù không bao giờ làm dứt được hận thù. Chỉ có không hận thù mới làm hận thù lắng xuống. Đó là quy luật muôn đời.",
     "Khi ta đáp lại cơn giận bằng cơn giận, ngọn lửa chỉ cháy lớn hơn. Khi ta dừng lại và đáp lại bằng sự hiểu biết, ngọn lửa không còn chất đốt.",
   ]),
   ("Chiến thắng chính mình", [
     "Kinh dạy rằng người thắng ngàn quân giữa chiến trường cũng chưa bằng người thắng được chính mình. Tự thắng mình mới là chiến thắng cao quý nhất.",
     "Thắng mình không phải là đè nén. Đó là nhận ra thói quen cũ, rồi kiên nhẫn chọn một cách ứng xử lành hơn.",
   ]),
   ("Tỉnh thức", [
     "Kinh Pháp Cú khuyên ta sống tỉnh thức, không buông lung. Người tỉnh thức như đang thật sự sống; người buông lung như đã chết dù thân vẫn còn.",
     "Tỉnh thức là biết mình đang nghĩ gì, nói gì, làm gì, ngay trong giây phút này.",
   ]),
   ("Lời dạy của chư Phật", [
     "Có một bài kệ được xem như tóm lược mọi lời dạy: không làm các điều ác, làm tất cả điều lành, giữ cho tâm ý trong sạch. Đó là lời dạy của chư Phật.",
     "Ba điều ấy rất giản dị để nhớ, nhưng cần cả một đời để thực hành.",
   ]),
   ("Thực tập", [
     "Hôm nay, trước khi đáp lại một lời làm mình khó chịu, hãy dừng lại ba hơi thở. Rồi tự hỏi: lời mình sắp nói có thật không, có cần thiết không, và có đem lại điều lành không. " + OUTRO,
   ]),
  ],
 },
 {
  "id": "chuyen-phap-luan", "title": "Kinh Chuyển Pháp Luân", "pali": "Dhammacakkappavattana Sutta · Tương Ưng 56.11",
  "tag": "Tứ Diệu Đế", "image": "assets/sutra-chuyen-phap-luan.jpg",
  "source": "https://suttacentral.net/sn56.11",
  "summary": "Bài pháp đầu tiên tại vườn Lộc Uyển: con đường Trung đạo, Bát Chánh Đạo và bốn sự thật cao quý.",
  "chapters": [
   ("Mở đầu", [
     "Gió Lành kính mời bạn cùng lắng nghe phần diễn ý Kinh Chuyển Pháp Luân, bài pháp đầu tiên của Đức Phật sau khi giác ngộ. " + INTRO,
   ]),
   ("Bối cảnh", [
     "Một thời, Đức Thế Tôn ở tại vườn Lộc Uyển, gần thành Ba La Nại. Ngài nói pháp cho năm vị tu sĩ từng cùng Ngài tu khổ hạnh.",
   ]),
   ("Con đường Trung đạo", [
     "Đức Phật dạy có hai cực đoan mà người xuất gia không nên theo. Một là đắm chìm trong dục lạc, thấp kém và không đem lại lợi ích. Hai là hành hạ thân xác, đau khổ và cũng không đem lại lợi ích.",
     "Tránh xa hai cực đoan ấy là con đường Trung đạo. Con đường này mở ra con mắt, mở ra hiểu biết, đưa đến an tịnh, trí tuệ, giác ngộ và Niết Bàn.",
     "Đó là Bát Chánh Đạo: chánh kiến, chánh tư duy, chánh ngữ, chánh nghiệp, chánh mạng, chánh tinh tấn, chánh niệm và chánh định.",
   ]),
   ("Bốn sự thật cao quý", [
     "Sự thật thứ nhất là khổ. Sinh, già, bệnh, chết là khổ. Gần người mình không ưa là khổ, xa người mình thương là khổ, mong cầu không được là khổ. Nói gọn lại, sự bám chấp vào năm uẩn là khổ.",
     "Sự thật thứ hai là nguyên nhân của khổ. Đó là lòng khao khát, luôn tìm cầu và dính mắc chỗ này chỗ kia: khao khát dục lạc, khao khát được tồn tại, và khao khát không tồn tại.",
     "Sự thật thứ ba là khổ có thể chấm dứt. Khi lòng khao khát ấy được buông bỏ hoàn toàn, không còn chỗ bám, thì khổ đau lắng dịu.",
     "Sự thật thứ tư là con đường đưa đến sự chấm dứt khổ, chính là Bát Chánh Đạo vừa kể.",
   ]),
   ("Ba lần chuyển, mười hai hành tướng", [
     "Đức Phật kể rằng với mỗi sự thật, Ngài đã thấy rõ ba điều: đây là sự thật, sự thật này cần được thực hiện, và sự thật này đã được thực hiện xong.",
     "Khổ cần được hiểu rõ. Nguyên nhân của khổ cần được buông bỏ. Sự chấm dứt khổ cần được chứng nghiệm. Con đường cần được tu tập.",
     "Chỉ khi cái thấy ấy hoàn toàn trong sáng, Ngài mới tuyên bố mình đã giác ngộ.",
   ]),
   ("Pháp nhãn đầu tiên", [
     "Nghe xong bài pháp, Tôn giả Kiều Trần Như khởi lên con mắt pháp trong sạch. Ngài thấy rõ: bất cứ điều gì có sinh khởi, đều có hoại diệt.",
     "Từ đó, bánh xe pháp bắt đầu chuyển, và không một sức mạnh nào trong đời có thể làm cho nó quay ngược.",
   ]),
   ("Thực tập", [
     "Khi gặp một nỗi phiền muộn, bạn có thể nhẹ nhàng hỏi mình bốn câu. Điều gì đang làm mình khổ? Điều gì đang nuôi lớn nỗi khổ ấy? Nếu buông được, mình sẽ nhẹ ra sao? Và hôm nay mình có thể làm một việc nhỏ nào? " + OUTRO,
   ]),
  ],
 },
 {
  "id": "hanh-phuc", "title": "Kinh Hạnh Phúc", "pali": "Maṅgala Sutta · Kinh Tập 2.4",
  "tag": "Sống thiện lành", "image": "assets/sutra-hanh-phuc.jpg",
  "source": "https://suttacentral.net/snp2.4",
  "summary": "Lời Đức Phật đáp một vị thiên: những phúc lành chân thật, từ cách chọn bạn đến một tâm vững vàng trước được mất.",
  "chapters": [
   ("Mở đầu", [
     "Gió Lành kính mời bạn cùng lắng nghe phần diễn ý Kinh Hạnh Phúc, còn gọi là Kinh Điềm Lành. " + INTRO,
   ]),
   ("Câu hỏi của vị thiên", [
     "Một đêm khuya, khi Đức Phật ở tại tinh xá Kỳ Viên, một vị thiên có ánh sáng rực rỡ đến đảnh lễ và hỏi: nhiều người đã suy nghĩ về điều gì là phúc lành, xin Ngài chỉ dạy đâu là phúc lành cao quý nhất.",
   ]),
   ("Chọn bạn và nơi chốn", [
     "Đức Phật dạy: không gần gũi kẻ xấu, thân cận người hiền trí, tôn kính người đáng kính. Đó là phúc lành cao quý nhất.",
     "Sống ở nơi thích hợp, đã từng gieo trồng phước lành, và giữ cho mình một hướng đi chân chánh. Đó là phúc lành cao quý nhất.",
   ]),
   ("Học hỏi và gia đình", [
     "Học rộng, có nghề nghiệp vững vàng, khéo giữ gìn giới hạnh, và nói lời hay lẽ phải. Đó là phúc lành cao quý nhất.",
     "Hiếu thảo với cha mẹ, chăm lo cho vợ con, làm việc ngăn nắp không rối ren. Đó là phúc lành cao quý nhất.",
     "Biết chia sẻ, sống đúng với lẽ phải, giúp đỡ người thân, và làm những việc không bị ai chê trách. Đó là phúc lành cao quý nhất.",
   ]),
   ("Nuôi dưỡng tâm", [
     "Tránh xa điều ác, không dùng chất say, không buông lung trong việc lành. Đó là phúc lành cao quý nhất.",
     "Biết cung kính, biết khiêm nhường, biết đủ, biết ơn, và lắng nghe giáo pháp đúng lúc. Đó là phúc lành cao quý nhất.",
     "Kiên nhẫn, dễ nghe lời khuyên, được gặp các bậc tu hành, và cùng nhau trao đổi về giáo pháp đúng lúc. Đó là phúc lành cao quý nhất.",
     "Tu tập tinh cần, sống đời trong sạch, thấy được các sự thật cao quý và chứng nghiệm Niết Bàn. Đó là phúc lành cao quý nhất.",
   ]),
   ("Tâm không lay động", [
     "Và khi tiếp xúc với những thăng trầm của cuộc đời, được hay mất, khen hay chê, tâm không lay động, không sầu muộn, không nhiễm ô, luôn an ổn. Đó là phúc lành cao quý nhất.",
     "Ai thực hành được những điều này, đi đến đâu cũng không bị khuất phục, đi đến đâu cũng được an lành.",
   ]),
   ("Thực tập", [
     "Tối nay, trước khi ngủ, bạn hãy ghi lại ba điều: một việc lành mình đã làm, một người mình muốn nói lời cảm ơn, và một thói quen tốt mình muốn tiếp tục vào ngày mai. " + OUTRO,
   ]),
  ],
 },
 {
  "id": "niem-xu", "title": "Kinh Niệm Xứ", "pali": "Satipaṭṭhāna Sutta · Trung Bộ 10",
  "tag": "Thiền quán", "image": "assets/sutra-niem-xu.jpg",
  "source": "https://suttacentral.net/mn10",
  "summary": "Bốn lĩnh vực quán niệm thân, cảm thọ, tâm và các pháp — con đường trực tiếp đưa đến thanh tịnh và an lạc.",
  "chapters": [
   ("Mở đầu", [
     "Gió Lành kính mời bạn cùng lắng nghe phần diễn ý Kinh Niệm Xứ, bài kinh nền tảng của thiền quán. " + INTRO,
   ]),
   ("Con đường trực tiếp", [
     "Một thời, Đức Phật ở xứ Câu Lâu, tại thị trấn Kammāsadhamma. Ngài dạy: đây là con đường trực tiếp đưa đến sự thanh tịnh cho chúng sinh, vượt qua sầu muộn và than khóc, chấm dứt khổ đau và ưu phiền, đạt được chánh trí và chứng nghiệm Niết Bàn. Đó là bốn lĩnh vực quán niệm.",
     "Người thực tập sống nhiệt tâm, tỉnh giác và chánh niệm, đặt xuống những tham muốn và ưu phiền đối với cuộc đời.",
   ]),
   ("Quán niệm thân", [
     "Thứ nhất là quán niệm thân. Hít vào, biết mình đang hít vào. Thở ra, biết mình đang thở ra.",
     "Khi đi biết mình đang đi, khi đứng biết mình đang đứng, khi ngồi biết mình đang ngồi, khi nằm biết mình đang nằm. Khi co tay, duỗi chân, ăn uống hay nói năng, đều làm trong tỉnh giác.",
     "Người ấy cũng quán sát thân này gồm nhiều phần khác nhau, gồm đất, nước, lửa, gió, và thân này rồi cũng sẽ tan rã.",
   ]),
   ("Quán niệm cảm thọ", [
     "Thứ hai là quán niệm cảm thọ. Khi có cảm giác dễ chịu, biết đây là cảm giác dễ chịu. Khi có cảm giác khó chịu, biết đây là cảm giác khó chịu. Khi không dễ chịu cũng không khó chịu, cũng biết rõ như vậy.",
     "Chỉ cần nhận biết, không vội bám lấy cảm giác dễ chịu, cũng không vội xua đuổi cảm giác khó chịu.",
   ]),
   ("Quán niệm tâm", [
     "Thứ ba là quán niệm tâm. Tâm có tham, biết tâm có tham. Tâm không tham, biết tâm không tham. Tâm có sân hay không có sân, tâm mê mờ hay sáng tỏ, tâm tán loạn hay tập trung, đều biết rõ như thật.",
   ]),
   ("Quán niệm các pháp", [
     "Thứ tư là quán niệm các pháp. Người ấy nhận biết năm triền cái đang có mặt hay vắng mặt: tham muốn, sân hận, hôn trầm, trạo hối và nghi ngờ.",
     "Người ấy quán sát năm uẩn, sáu căn và sáu trần, bảy yếu tố giác ngộ, và bốn sự thật cao quý.",
   ]),
   ("Thấy sinh và diệt", [
     "Trong cả bốn lĩnh vực, người thực tập thấy rõ sự sinh khởi và sự hoại diệt. Người ấy biết rằng có thân, có cảm thọ, có tâm, có pháp, chỉ vừa đủ để hiểu biết và tỉnh thức. Người ấy sống không nương tựa, không bám chấp vào bất cứ điều gì trong cuộc đời.",
     "Đức Phật dạy, ai thực tập như vậy trong bảy năm, cho đến bảy ngày, có thể gặt hái kết quả giải thoát.",
   ]),
   ("Thực tập", [
     "Trong năm phút tới, bạn hãy chọn một việc rất bình thường, như rửa tay hay uống một ngụm trà. Hãy cảm nhận nước, hơi ấm, hơi thở, và nhận ra những suy nghĩ đang đi qua, rồi nhẹ nhàng trở về. " + OUTRO,
   ]),
  ],
 },
 {
  "id": "nhap-tuc-xuat-tuc", "title": "Kinh Nhập tức, Xuất tức niệm", "pali": "Ānāpānasati Sutta · Trung Bộ 118",
  "tag": "Chánh niệm hơi thở", "image": "assets/sutra-hoi-tho.jpg",
  "source": "https://suttacentral.net/mn118",
  "summary": "Mười sáu phép quán niệm hơi thở, đưa đến bốn niệm xứ, bảy yếu tố giác ngộ, trí tuệ và giải thoát.",
  "chapters": [
   ("Mở đầu", [
     "Gió Lành kính mời bạn cùng lắng nghe phần diễn ý Kinh Nhập tức, Xuất tức niệm, hay Kinh Quán niệm hơi thở. " + INTRO,
   ]),
   ("Bối cảnh", [
     "Một thời, Đức Phật ở tại Đông Viên, giảng đường của bà Lộc Mẫu, gần thành Xá Vệ, cùng rất nhiều vị đệ tử. Vào đêm trăng tròn sau mùa an cư, thấy chúng tăng tinh tấn, Ngài dạy về pháp quán niệm hơi thở.",
     "Ngài dạy: quán niệm hơi thở, nếu được tu tập và làm cho sung mãn, sẽ đem lại quả lớn và lợi ích lớn.",
   ]),
   ("Bốn phép về thân", [
     "Người thực tập đi vào rừng, đến gốc cây hay một nơi vắng vẻ, ngồi thẳng lưng và đặt chánh niệm trước mặt. Chánh niệm, người ấy thở vào. Chánh niệm, người ấy thở ra.",
     "Thở vào dài, biết mình thở vào dài. Thở ra ngắn, biết mình thở ra ngắn.",
     "Cảm nhận toàn thân, ta thở vào. Làm lắng dịu thân, ta thở ra.",
   ]),
   ("Bốn phép về cảm thọ", [
     "Cảm nhận niềm vui, ta thở vào. Cảm nhận an lạc, ta thở ra.",
     "Nhận biết những hoạt động của tâm, ta thở vào. Làm lắng dịu những hoạt động ấy, ta thở ra.",
   ]),
   ("Bốn phép về tâm", [
     "Nhận biết tâm, ta thở vào. Làm cho tâm hoan hỷ, ta thở ra.",
     "Làm cho tâm định tĩnh, ta thở vào. Làm cho tâm được giải thoát, ta thở ra.",
   ]),
   ("Bốn phép về các pháp", [
     "Quán chiếu vô thường, ta thở vào. Quán chiếu sự buông bỏ tham muốn, ta thở ra.",
     "Quán chiếu sự chấm dứt, ta thở vào. Quán chiếu sự buông xả, ta thở ra.",
   ]),
   ("Kết quả của sự thực tập", [
     "Đức Phật dạy, mười sáu phép thở này làm viên mãn bốn lĩnh vực quán niệm. Bốn lĩnh vực quán niệm làm viên mãn bảy yếu tố giác ngộ: chánh niệm, trạch pháp, tinh tấn, hỷ, khinh an, định và xả.",
     "Và bảy yếu tố giác ngộ, khi được tu tập đầy đủ, làm viên mãn trí tuệ và giải thoát.",
   ]),
   ("Thực tập", [
     "Bây giờ, mời bạn ngồi thoải mái và để hơi thở tự nhiên. Khi thở vào, thầm biết: đang thở vào. Khi thở ra, thầm biết: đang thở ra.",
     "Nếu tâm đi xa, không sao cả. Chỉ cần mỉm cười và nhẹ nhàng trở về với hơi thở. " + OUTRO,
   ]),
  ],
 },
]


def norm(s):
    return re.sub(r"\s+", "", s)


BYTES_PER_SEC = 6000  # edge-tts xuất audio-24khz-48kbitrate-mono-mp3 (CBR)


CACHE = ROOT / "tools" / ".tts-cache"  # lưu từng đoạn đã tạo; xóa thư mục này để tạo lại từ đầu


async def synth_para(text):
    """Tạo âm thanh một đoạn. Dịch vụ thỉnh thoảng trả rỗng nên thử lại nhiều lần;
    đoạn nào xong được lưu vào bộ nhớ đệm để chạy lại không phải làm lại."""
    import hashlib
    key = hashlib.sha1(f"{VOICE}|{RATE}|{PITCH}|{text}".encode("utf-8")).hexdigest()[:16]
    CACHE.mkdir(parents=True, exist_ok=True)
    fa, fj = CACHE / f"{key}.mp3", CACHE / f"{key}.json"
    if fa.exists() and fj.exists() and fa.stat().st_size:
        return fa.read_bytes(), [tuple(x) for x in json.loads(fj.read_text(encoding="utf-8"))]
    for attempt in range(40):
        audio, bounds = bytearray(), []
        try:
            com = edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH, boundary="SentenceBoundary")
            async for chunk in com.stream():
                if chunk["type"] == "audio":
                    audio += chunk["data"]
                elif chunk["type"] == "SentenceBoundary":
                    bounds.append((chunk["offset"] / 1e7, chunk["text"]))
            if audio:
                fa.write_bytes(bytes(audio)); fj.write_text(json.dumps(bounds, ensure_ascii=False), encoding="utf-8")
                return bytes(audio), bounds
        except Exception:
            pass
        await asyncio.sleep(min(2 + attempt * 0.7, 12))
    raise RuntimeError("Không tạo được âm thanh cho đoạn: " + text[:60])


async def synth(item):
    OUT_AUDIO.mkdir(parents=True, exist_ok=True)
    mp3 = OUT_AUDIO / f"{item['id']}.mp3"
    out_chapters = [{"title": t, "paras": []} for t, _ in item["chapters"]]
    data, nsent = bytearray(), 0
    for ci, (_, ps) in enumerate(item["chapters"]):
        for p in ps:
            start = len(data) / BYTES_PER_SEC
            audio, bounds = await synth_para(p)
            data += audio
            sents = [[round(start + off, 2), tx.strip()] for off, tx in bounds] or [[round(start, 2), p]]
            out_chapters[ci]["paras"].append(sents)
            nsent += len(sents)
    mp3.write_bytes(bytes(data))
    duration = round(len(data) / BYTES_PER_SEC, 1)
    print(f"  {item['id']}: {duration:.0f}s, {nsent} câu, {len(data) // 1024} KB", flush=True)
    return {k: item[k] for k in ("id", "title", "pali", "tag", "image", "source", "summary")} | {
        "audio": f"assets/audio/nghe-kinh/{item['id']}.mp3", "duration": duration, "chapters": out_chapters}


async def main(only):
    old = {}
    if OUT_JS.exists() and only:
        raw = OUT_JS.read_text(encoding="utf-8")
        old = {x["id"]: x for x in json.loads(raw[raw.index("["):raw.rindex("]") + 1])}
    result = []
    for item in LISTEN:
        if only and item["id"] not in only and item["id"] in old:
            result.append(old[item["id"]]); continue
        result.append(await synth(item))
    OUT_JS.write_text(
        "/* Gió Lành 7.15 — Dữ liệu Thư viện nghe kinh. TỰ SINH bởi tools/build_listen_audio.py — không sửa tay. */\n"
        "window.GioListenData=" + json.dumps(result, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print("Đã ghi", OUT_JS.relative_to(ROOT))


if __name__ == "__main__":
    asyncio.run(main(set(sys.argv[1:])))
