# -*- coding: utf-8 -*-
"""Gió Lành — Biên soạn & tạo giọng hướng dẫn cho "Thiền có hướng dẫn".

    python tools/build_meditation_audio.py

Mỗi bài thiền là chuỗi lời nhắc đặt ở mốc thời gian (giây); giữa các lời nhắc là khoảng lặng để thực tập.
Kết quả: assets/audio/thien/<bài>-<nn>.mp3 và js/thien-data.js (tự sinh — đừng sửa tay).
Dùng chung bộ nhớ đệm và cơ chế thử lại với tools/build_listen_audio.py.
"""
import asyncio, json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import build_listen_audio as B

ROOT = B.ROOT
OUT = ROOT / "assets" / "audio" / "thien"
OUT_JS = ROOT / "js" / "thien-data.js"
B.RATE = "-14%"          # chậm hơn bài nghe kinh, hợp với thiền

MEDITATIONS = [
 {"id": "hoi-tho", "title": "Trở về hơi thở", "minutes": 5, "tag": "Cho người mới", "icon": "☁",
  "desc": "Nhận biết hơi thở vào, hơi thở ra; học cách nhẹ nhàng quay về mỗi khi tâm đi xa.",
  "cues": [
   (4,   "Chào bạn. Mời bạn ngồi thật thoải mái, lưng thẳng nhưng không gồng, hai vai thả lỏng. Có thể khép nhẹ mắt, hoặc để ánh mắt nghỉ trên mặt đất phía trước."),
   (30,  "Bây giờ, hãy để ý đến hơi thở. Thở vào, biết mình đang thở vào. Thở ra, biết mình đang thở ra."),
   (62,  "Không cần làm cho hơi thở dài hơn hay sâu hơn. Hơi thở thế nào, chỉ cần biết nó như thế ấy."),
   (100, "Bạn có thể cảm nhận hơi thở ở chóp mũi, hoặc ở bụng đang phồng lên khi thở vào, xẹp xuống khi thở ra. Chọn một chỗ, và để sự chú ý nghỉ ở đó."),
   (145, "Nếu tâm đi lang thang sang chuyện khác, điều đó rất bình thường. Chỉ cần nhận ra, mỉm cười, rồi nhẹ nhàng đưa sự chú ý trở về hơi thở."),
   (195, "Thở vào, tâm lắng dịu. Thở ra, thân buông thư."),
   (240, "Thở vào, tôi đang có mặt ở đây. Thở ra, giây phút này thật đẹp."),
   (272, "Chúng ta sắp kết thúc. Hãy thở thêm vài hơi thật trọn vẹn, rồi từ từ mở mắt khi tiếng chuông vang lên."),
  ]},
 {"id": "quet-than", "title": "Quét thân thư giãn", "minutes": 10, "tag": "Buông căng thẳng", "icon": "✦",
  "desc": "Đưa sự chú ý đi qua từng vùng trên cơ thể, nhận biết và buông thư những chỗ đang căng.",
  "cues": [
   (4,   "Chào bạn. Bạn có thể ngồi hoặc nằm, miễn là thật thoải mái. Để hai tay nghỉ tự nhiên. Thở vào thật nhẹ, và thở ra thật dài."),
   (40,  "Hãy cảm nhận toàn thân đang được nâng đỡ bởi mặt ghế, mặt sàn hay tấm nệm. Cho phép sức nặng của cơ thể được buông xuống."),
   (85,  "Bây giờ, đưa sự chú ý xuống hai bàn chân. Cảm nhận các ngón chân, lòng bàn chân, gót chân. Ấm hay mát, nặng hay nhẹ, chỉ cần biết."),
   (135, "Đưa sự chú ý lên hai cẳng chân, hai đầu gối, rồi hai đùi. Thở vào, nhận biết đôi chân. Thở ra, để đôi chân thư giãn."),
   (185, "Nhận biết vùng hông và bụng. Cảm nhận bụng phồng lên khi thở vào, xẹp xuống khi thở ra. Nếu bụng đang thắt lại, hãy để nó mềm ra."),
   (240, "Đưa sự chú ý lên lồng ngực và vùng tim. Cảm nhận nhịp thở và nhịp tim, những người bạn âm thầm làm việc cho ta suốt ngày đêm. Hãy gửi đến chúng lòng biết ơn."),
   (300, "Nhận biết lưng, từ thắt lưng lên đến hai bả vai. Nơi đây thường mang nhiều mệt mỏi. Thở ra, và để hai vai hạ xuống."),
   (355, "Đưa sự chú ý xuống hai cánh tay, hai bàn tay, đến từng đầu ngón tay. Để đôi tay hoàn toàn được nghỉ ngơi."),
   (405, "Nhận biết cổ và họng, rồi đến khuôn mặt. Thả lỏng hàm, thả lỏng vùng quanh mắt, thả lỏng vầng trán. Một nụ cười rất nhẹ trên môi."),
   (460, "Bây giờ, hãy cảm nhận toàn thân như một khối thống nhất, đang thở, đang sống, đang an ổn ngay trong giây phút này."),
   (520, "Thở vào, tôi biết thân này đang có mặt. Thở ra, tôi mỉm cười với thân này."),
   (568, "Chúng ta sắp kết thúc. Hãy cử động nhẹ các ngón tay, ngón chân, rồi từ từ trở lại khi tiếng chuông vang lên."),
  ]},
 {"id": "tu-bi", "title": "Từ bi quán", "minutes": 20, "tag": "Nuôi dưỡng tình thương", "icon": "♡",
  "desc": "Gửi lời chúc bình an đến chính mình, người thương, người xa lạ, người còn khó khăn và tất cả muôn loài.",
  "cues": [
   (4,    "Chào bạn. Mời bạn ngồi yên, lưng thẳng, vai thả lỏng. Chúng ta bắt đầu bằng vài hơi thở thật nhẹ để lắng tâm."),
   (35,   "Thở vào, biết mình đang thở vào. Thở ra, biết mình đang thở ra. Để thân và tâm dần lắng xuống, như mặt hồ sau cơn gió."),
   (120,  "Bây giờ, hãy hướng tình thương về chính mình. Đặt một tay lên ngực nếu bạn muốn, và thầm nhắc: mong tôi được bình an. Mong tôi được khỏe mạnh. Mong tôi được an vui, nhẹ nhàng."),
   (200,  "Nếu có điều gì khó khăn đang đến, hãy để nó có mặt. Thầm nhắc: mong tôi biết chăm sóc nỗi khổ của mình. Mong tôi biết tha thứ cho chính mình."),
   (300,  "Tiếp theo, hãy nghĩ đến một người bạn thương. Thấy rõ khuôn mặt, nụ cười của người ấy. Thầm nhắc: mong bạn được bình an. Mong bạn được khỏe mạnh. Mong bạn được an vui."),
   (420,  "Bây giờ, nghĩ đến một người mình không thân, như người bán hàng, người hàng xóm, một người lướt qua hôm nay. Họ cũng mong hạnh phúc như ta. Thầm nhắc: mong bạn được bình an, mong bạn được an vui."),
   (560,  "Nếu bạn cảm thấy sẵn sàng, hãy nghĩ đến một người đang làm mình khó chịu. Không cần ép mình. Chỉ thử thấy rằng họ cũng có khổ đau. Thầm nhắc: mong bạn bớt khổ. Mong bạn được bình an."),
   (720,  "Bây giờ, hãy để tình thương lan rộng ra, đến tất cả mọi người trong nhà, trong phố, trong đất nước này, và khắp mọi nơi trên thế giới."),
   (820,  "Mong tất cả mọi loài, dù lớn hay nhỏ, gần hay xa, thấy được hay không thấy được, đều được bình an. Mong tất cả đều được an vui."),
   (960,  "Hãy nghỉ ngơi trong cảm giác rộng mở này. Không cần nói gì thêm. Chỉ có mặt, và để lòng mình rộng như bầu trời."),
   (1110, "Thở vào, tôi nuôi dưỡng tình thương. Thở ra, tôi gửi tình thương đến mọi người."),
   (1160, "Chúng ta sắp kết thúc. Nguyện cho bạn, cho những người bạn thương, và cho tất cả mọi loài được bình an. Từ từ mở mắt khi tiếng chuông vang lên."),
  ]},
]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    data = []
    for m in MEDITATIONS:
        total = m["minutes"] * 60
        cues = []
        for n, (at, text) in enumerate(m["cues"], 1):
            audio, _ = await B.synth_para(text)
            f = OUT / f"{m['id']}-{n:02d}.mp3"
            f.write_bytes(audio)
            dur = round(len(audio) / B.BYTES_PER_SEC, 2)
            cues.append({"at": at, "dur": dur, "text": text, "audio": f"assets/audio/thien/{f.name}"})
        # kiểm tra: lời nhắc không chồng lên nhau, không vượt quá thời lượng
        for a, b in zip(cues, cues[1:]):
            if a["at"] + a["dur"] + 3 > b["at"]:
                print(f"  ⚠ {m['id']}: lời nhắc ở {a['at']}s dài {a['dur']}s chồng sang {b['at']}s — dời lời sau.")
                b["at"] = round(a["at"] + a["dur"] + 4)
        if cues[-1]["at"] + cues[-1]["dur"] + 6 > total:
            total = int(cues[-1]["at"] + cues[-1]["dur"] + 8)
        print(f"  {m['id']}: {len(cues)} lời nhắc, {total}s", flush=True)
        data.append({k: m[k] for k in ("id", "title", "minutes", "tag", "icon", "desc")} | {"duration": total, "cues": cues})
    OUT_JS.write_text("/* Gió Lành — Dữ liệu thiền có hướng dẫn. TỰ SINH bởi tools/build_meditation_audio.py. */\n"
                      "window.GioThienData=" + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print("Đã ghi", OUT_JS.relative_to(ROOT))


if __name__ == "__main__":
    asyncio.run(main())
