#!/usr/bin/env python3
"""Synthesize the 48 second ambient electronic soundtrack for the demo video.

All sound is generated from scratch with numpy: detuned pads, a plucked
arpeggio, a soft kick, hats, and a rising transition sweep. No samples and no
external audio files are used.
"""

import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "artifacts" / "demo" / "soundtrack.wav"

SR = 44100
DURATION = 48.0

# A minor, F major, C major, G major, A minor, F major. One chord per scene.
CHORDS = [
    (110.00, [220.00, 261.63, 329.63]),
    (87.31, [174.61, 220.00, 261.63]),
    (130.81, [261.63, 329.63, 392.00]),
    (98.00, [196.00, 246.94, 293.66]),
    (110.00, [220.00, 261.63, 329.63]),
    (87.31, [174.61, 220.00, 261.63]),
]

ARP = [440.00, 523.25, 659.25, 783.99, 659.25, 523.25, 440.00, 392.00]


def adsr(t: np.ndarray, attack: float, decay: float) -> np.ndarray:
    env = np.minimum(1.0, t / max(attack, 1e-4))
    return env * np.exp(-t / max(decay, 1e-4))


def main():
    n = int(SR * DURATION)
    t = np.arange(n) / SR
    mix = np.zeros(n, dtype=np.float64)

    # Pad: two detuned voices per chord tone plus a sub root.
    for segment, (root, tones) in enumerate(CHORDS):
        start = segment * 8.0
        end = start + 8.0
        mask = (t >= start) & (t < end)
        local = t[mask] - start
        env = np.minimum(1.0, local / 1.4) * np.minimum(1.0, (8.0 - local) / 1.4)
        pad = np.zeros_like(local)
        for freq in tones:
            for detune in (-0.35, 0.35):
                pad += np.sin(2 * np.pi * (freq + detune) * local)
        pad += 0.6 * np.sin(2 * np.pi * root * local)
        # Slow chorus movement.
        pad *= 1.0 + 0.08 * np.sin(2 * np.pi * 0.13 * local)
        mix[mask] += pad * env * 0.045

    # Plucked arpeggio, eighth notes at 100 BPM.
    step = 0.30
    for index, start in enumerate(np.arange(8.0, 39.5, step)):
        length = 0.26
        mask = (t >= start) & (t < start + length)
        if not mask.any():
            continue
        local = t[mask] - start
        freq = ARP[index % len(ARP)]
        env = adsr(local, 0.004, 0.10)
        tone = np.sin(2 * np.pi * freq * local) + 0.35 * np.sin(4 * np.pi * freq * local)
        mix[mask] += tone * env * 0.075

    # Soft kick on every two beats.
    for start in np.arange(8.0, 45.0, 1.2):
        mask = (t >= start) & (t < start + 0.40)
        if not mask.any():
            continue
        local = t[mask] - start
        freq = 52.0 + 46.0 * np.exp(-local * 26.0)
        phase = 2 * np.pi * np.cumsum(freq) / SR
        mix[mask] += np.sin(phase) * np.exp(-local * 9.0) * 0.34

    # Hats from 16 seconds, short filtered noise bursts.
    rng = np.random.default_rng(7)
    for start in np.arange(16.0, 44.0, 0.6):
        mask = (t >= start) & (t < start + 0.06)
        if not mask.any():
            continue
        local = t[mask] - start
        noise = rng.standard_normal(local.size)
        noise = np.diff(noise, prepend=noise[0])  # crude high pass
        mix[mask] += noise * np.exp(-local * 70.0) * 0.035

    # Transition sweep into the final reveal.
    sweep_mask = (t >= 39.0) & (t < 43.0)
    if sweep_mask.any():
        local = t[sweep_mask] - 39.0
        freq = 160.0 + 900.0 * (local / 4.0) ** 1.6
        phase = 2 * np.pi * np.cumsum(freq) / SR
        mix[sweep_mask] += np.sin(phase) * np.linspace(0.0, 0.09, local.size) * np.exp(-local * 0.6)

    # Master envelope and gentle stereo width.
    fade_in = np.minimum(1.0, t / 1.2)
    fade_out = np.minimum(1.0, (DURATION - t) / 1.8)
    mix *= np.clip(fade_in, 0, 1) * np.clip(fade_out, 0, 1)
    mix = np.tanh(mix * 1.15)
    peak = np.max(np.abs(mix)) or 1.0
    mix = mix / peak * 0.88

    delay = int(SR * 0.012)
    left = mix
    right = np.concatenate([np.zeros(delay), mix[:-delay]])
    stereo = np.stack([left, right], axis=1)
    pcm = (np.clip(stereo, -1.0, 1.0) * 32767).astype(np.int16)

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(TARGET), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(pcm.tobytes())

    print("wrote", TARGET, TARGET.stat().st_size, "bytes", "peak", round(float(peak), 3))


if __name__ == "__main__":
    main()
