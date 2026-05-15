# ElevenLabs Audio Prompt Package — Phonara Signature Slots

> 7개 Signature Slot 공용 + 슬롯별 SFX/Voice 생성 가이드.  
> 모든 출력: `mp3_44100_128`, mono 우선, peak −1 dBFS, RMS −14 LUFS.  
> SFX: `sound-generation` API. Voice: `text-to-speech/{voiceId}` API.  
> 슬롯 자산 경로 규약: `/public/sounds/{slot_id}/sfx/{key}.mp3` · `/public/sounds/{slot_id}/voice/{key}.mp3`.

---

## 0. 공통 SFX (`/sounds/common/sfx/`)

| key | duration_seconds | prompt |
|---|---|---|
| `spin_start` | 0.6 | "Short mechanical reel spin start, deep low whoosh with subtle metallic click, casino slot machine, dry punchy mix" |
| `reel_stop` | 0.4 | "Single reel stop click, crisp hardwood thud with light coin chime tail, casino slot, very short" |
| `button_click` | 0.15 | "Minimal UI tap, soft glassy click, premium mobile interface, very short" |
| `coin_drop` | 0.9 | "Heavy gold coins cascading into a metal tray, bright clinking, generous reverb, celebratory" |
| `big_win_trigger` | 1.6 | "Bright orchestral hit with shimmering bell rise, BIG WIN celebration sting, casino slot, no voice" |
| `mega_win` | 2.2 | "MEGA WIN cinematic riser into orchestral hit, brass stabs, choir swell, triumphant, no voice" |
| `epic_win` | 2.8 | "EPIC WIN huge orchestral fanfare, taiko drums, choir, ascending brass, climactic impact, no voice" |
| `legendary_win` | 3.4 | "LEGENDARY WIN earth-shaking cinematic stinger, deep sub drop, full orchestra and choir, divine triumph, ends with sparkling decay, no voice" |

**Recommended `prompt_influence`:** 0.4 for stings, 0.3 for clicks.

---

## 1. Slot-specific SFX & Voice

### 1.1 Cosmic Forge 5000 (`cosmic_forge`)
| key | type | duration | voice / prompt |
|---|---|---|---|
| `cosmic_explosion` | sfx | 2.6 | "Cosmic supernova explosion, deep sub-bass impact, glittering star debris, reverse swell into thunderous boom, ethereal tail" |
| `emperor_voice` | voice | ~2.5 | Voice **George (`JBFqnCBsd6RMkjVDRZzb`)** · stability 0.45 / similarity 0.85 / style 0.7 — *"COSMIC EMPEROR... rise and claim the heavens."* |

### 1.2 Neon Tokyo 88 (`neon_tokyo_88`)
| key | type | duration | voice / prompt |
|---|---|---|---|
| `neon_jingle` | sfx | 1.8 | "Vaporwave neon synth jingle, retro 80s arcade sting, bright saw lead with vinyl crackle, short and punchy" |
| `cyber_announce` | voice | ~2.0 | Voice **Jessica (`cgSgspJ2msm6clMCkdW9`)** · stability 0.4 / style 0.6 — *"Neon overdrive engaged. Tokyo eighty-eight unleashed."* (slight robotic processing in post) |

### 1.3 Wizard 2000 (`wizard_2000`)
| key | type | duration | voice / prompt |
|---|---|---|---|
| `wizard_spell` | sfx | 1.4 | "Magical spell cast, sparkling rising arpeggio with crystalline shimmer, fantasy game, soft tail" |
| `magic_chime` | sfx | 0.8 | "Bright fantasy chime, single bell strike with glittering harmonics, short" |
| `wizard_decree` | voice | ~2.5 | Voice **Daniel (`onwK4e9ZLuTAKqWW03F9`)** · stability 0.55 / style 0.6 — *"By the ancient pact... MAXIMUS ARCANUM!"* |

### 1.4 Dragon Empire (`dragon_empire`)
| key | type | duration | voice / prompt |
|---|---|---|---|
| `flame_whoosh` | sfx | 1.2 | "Massive dragon flame breath whoosh, deep low rumble with high-frequency crackling fire, cinematic" |
| `dragon_roar` | voice | ~3.0 | Voice **Brian (`nPczCjzI2devNBz1zQrb`)** · stability 0.3 / style 0.85 — *"RRROOOAAARRR... bow before the Dragon Empire!"* (heavy growl, processed +octave-down layer in post) |

### 1.5 Pirate's Curse 1500 (`pirate_curse`)
| key | type | duration | voice / prompt |
|---|---|---|---|
| `cannon_fire` | sfx | 1.5 | "Heavy ship cannon fire, deep boom followed by rolling sea reverb and wood creak, cinematic naval battle" |
| `treasure_open` | sfx | 1.8 | "Old wooden treasure chest creaking open, gold coins shifting, magical sparkle reveal, adventurous" |
| `pirate_laugh` | voice | ~2.5 | Voice **Callum (`N2lVS1w4EtoT3dr4eOWO`)** · stability 0.35 / style 0.8 — *"Yarrr har har! The curse is lifted, lad — claim ye treasure!"* |

### 1.6 Pharaoh's Vault 2500 (`pharaoh_vault`)
| key | type | duration | voice / prompt |
|---|---|---|---|
| `ankh_chime` | sfx | 1.2 | "Ancient Egyptian bronze ankh chime, mystical metallic ring with desert wind tail, sacred temple atmosphere" |
| `sand_wind` | sfx | 2.4 | "Desert sandstorm wind sweeping through stone columns, low rumbling with high sand particles, immersive" |
| `pharaoh_voice` | voice | ~2.8 | Voice **Eric (`cjVigY5qzO86Huf0OWal`)** · stability 0.5 / style 0.75 — *"The vault opens... walk among the gods, mortal one."* |

### 1.7 Cherry Sakura 500 (`cherry_sakura`) — KR 50–70대 타겟, voice 생략
| key | type | duration | voice / prompt |
|---|---|---|---|
| `sakura_petal_fall` | sfx | 2.0 | "Soft cherry blossom petals drifting in a warm spring breeze, delicate koto string plucks, distant temple bell, tranquil and elegant" |
| `lantern_glow` | sfx | 1.6 | "Gentle paper lantern flickering, low warm wood resonance, single soft chime, peaceful Korean spring evening" |
| `cherry_blessing` *(optional, not wired)* | voice (KR) | ~2.5 | Voice **Sarah (`EXAVITQu4vr4xnSDxMaL`)** · stability 0.7 / style 0.4 — KR 라인: *"벚꽃이 피었습니다. 행운이 함께하기를."* (다국어 모델 `eleven_multilingual_v2`) — **현재 빌드에서는 비활성**, 나중에 enable 시 `cherry_sakura.voice`에 추가만 하면 됨. |

---

## 2. 생성 스크립트 예시 (Edge Function 기준)

```ts
const r = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
  method: "POST",
  headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Cosmic supernova explosion ...", duration_seconds: 2.6, prompt_influence: 0.4 }),
});
```

```ts
// Voice — 반드시 ?output_format=mp3_44100_128 query param
const r = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
  {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "COSMIC EMPEROR... rise and claim the heavens.",
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.7, use_speaker_boost: true },
    }),
  },
);
```

---

## 3. Post-processing 체크리스트

- [ ] −1 dBFS true peak limiter
- [ ] −14 LUFS integrated (모바일 라우드네스 일관성)
- [ ] 100ms 이상 silence는 trim
- [ ] 모든 win sting 끝부분 200ms fade-out (BGM ducking 회복과 자연스러운 교차)
- [ ] Voice 라인은 7~9 kHz 영역 +2dB de-essing 후 lift (모바일 스피커 가독성)

## 4. 자산 미존재 시 동작

`SlotSoundManager`는 자산 로딩 실패 → procedural 폴백(`@/lib/slotSound.playSlotCue`) 으로 자동 라우팅한다.  
즉 위 목록 중 일부만 먼저 제작해도 서비스 무중단으로 점진 교체 가능.
