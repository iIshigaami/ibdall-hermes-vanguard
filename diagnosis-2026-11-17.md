# Diagnosis awal — ibdall-hermes-vanguard (17 Nov 2026)

Sumber: `GET /api/bots/ibdall-hermes-vanguard`, `GET /api/matches/<id>`, replay publik terverifikasi via `bt-replay.mjs`. Bukan spekulasi.

## State
- Nov Cup: rank 91/204, rating 1218 (RD 35), score 1147, 97 set (39W/39L/19D), butuh 100 set, `qualified: false`.
- Public: rank 134/277, rating 1287 (RD 46), 58 set (25W/23L/10D).
- 10 set terakhir: 5W-4L-1D. Versi aktif `v1-wavefront`, health bersih (0 timeout/exception/idle).

## Akar masalah (dari replay m_01012401de20, kalah 0-2 dari qinglong)
Draft: kita `apc/apc/mbt/scout`, lawan `apc/mbt/mbt`.

| unit | dmg | taken | kills | shots | obj ticks | hp |
|---|---:|---:|---:|---:|---:|---|
| A apc#1 (kita) | 40 | 111 | 0 | 11 | 2989 | mati |
| A apc#2 (kita) | 8 | 145 | 0 | 4 | 80 | mati @t706 |
| A mbt#3 (kita) | 74 | 173 | 0 | 2 | 376 | mati @t1845 |
| A scout#4 (kita) | 10 | 82 | 0 | 5 | 2741 | mati @t3087 |
| B mbt#6 (lawan) | 374 | 56 | 4 | 10 | 1183 | 104/160 |
| B mbt#7 (lawan) | 126 | 0 | 0 | 4 | 0 | 160/160 |

Replay terverifikasi, result: side B menang karena **eliminasi** pada t=3330, meski score kita lebih tinggi (17934 vs 16746). Total damage kita 132 vs lawan 511; 0 kill vs 4 kill.

### 1. Draft statis — paling dominan
`draft()` selalu `apc/apc/mbt/scout` tanpa melihat peta/lawan. Lawan memakai 2 MBT; satu MBT lawan saja menghasilkan 374 damage dan 4 kill, sementara seluruh tim kita 132. APC + scout tidak punya daya tahan untuk duel MBT.

### 2. Kalah di trade, bukan di skor
Kita sempat unggul skor sampai t=1845, lalu MBT kita mati dan objektif #0 jatuh ke lawan sampai akhir. Kalah terjadi karena **semua unit kita hilang**, bukan karena skor lebih rendah. Prioritas harusnya survival + zona tembak, bukan duduk di titik.

### 3. APC menit di objektif lalu mati
APC#2 hanya 80 tick di objektif sebelum mati pukul 706. Logika `hold` (throttle 0 saat `distance < radius*0.55`) membuat unit diam di dalam radius — target empuk bagi MBT lawan. MBT#3 hanya 376 tick objektif sebelum mati.

### 4. Tidak ada tembakan terkonsentrasi / penanggulangan armor
MBT kita cuma 2 tembakan di set ini (vs 10 dari satu MBT lawan). Target dipilih per-unit dengan nilai `hpFrac` + jarak, bukan prioritas ancaman bersama; tidak ada drone/artileri/missile dalam draft untuk menjawab armor dari jarak.

## Usulan (belum di-upload, butuh persetujuan)
1. Draft adaptif: jika peta 2 objektif atau terdeteksi lawan armor-heavy, pakai `apc/mbt/mbt` (atau `mbt/mbt/scout`) alih-alih 2 APC + scout.
2. APC `hold` di tepi radius (bukan tengah) + mundur saat ada kontak MBT dalam jarak tembaknya; jangan diam saat `u.blocked`.
3. Prioritas tembakan bersama: fokus unit lawan yang sudah low-HP / MBT aktif, dan longgarkan gate `aimTolerance*.85` agar MBT lebih sering menembak.

## Realita target top 1
Pimpinan cup: 644 set, rating 1723, score 1673, 431W/75L/138D. Kita: 97 set, rating 1218. Cup berakhir 30 Nov. Pada laju saat ini (~6-7 set/hari) kita hanya akan mencapai ~190 set — mengejar 644 set dan +500 rating tidak realistis dalam sisa waktu. Target yang masih masuk akal: naikkan win rate dan rating, kejar peringkat menengah atas; top 1 butuh perbaikan controller besar + volume set jauh lebih tinggi.
