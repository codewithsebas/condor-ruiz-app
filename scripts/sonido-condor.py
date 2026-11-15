# Sonido de notificación «cóndor»: dos aletazos amplios y un grito de rapaz que baja de tono, con eco de montaña.
# Todo sintetizado (sin muestras de terceros), así no hay licencia de por medio. Genera public/sounds/condor.mp3:
#   python -I scripts/sonido-condor.py condor.wav
#   ffmpeg -i condor.wav -af "loudnorm=I=-16:TP=-2:LRA=7" -b:a 128k public/sounds/condor.mp3
import sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(7)


def band(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lowpass(x, f, order=4):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def env(n, attack, release, curve=2.0):
    t = np.linspace(0, 1, n)
    a = max(1, int(n * attack))
    r = max(1, int(n * release))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** 0.6
    e[-r:] = np.linspace(1, 0, r) ** curve
    return e


def wing(dur, gain):
    # Aletazo: ruido que sube y baja, con el filtro abriéndose en el golpe (aire empujado por plumas largas).
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    low = band(noise, 120, 900) * 1.0
    mid = band(noise, 900, 3200) * 0.35
    t = np.linspace(0, 1, n)
    shape = np.sin(np.pi * t) ** 1.6 * (1 - 0.35 * t)
    flutter = 1 + 0.25 * np.sin(2 * np.pi * 38 * t * dur)  # el borde de las plumas vibrando
    return (low + mid) * shape * flutter * gain


def cry(dur, f_start, f_end, gain):
    # Grito de rapaz: fundamental que cae de tono, armónicos ásperos, vibrato rápido y un poco de aire.
    n = int(SR * dur)
    t = np.arange(n) / SR
    k = t / dur
    f0 = f_start + (f_end - f_start) * (k ** 0.7)
    f0 = f0 * (1 + 0.018 * np.sin(2 * np.pi * 27 * t))  # trémolo de la garganta
    phase = 2 * np.pi * np.cumsum(f0) / SR
    tone = np.zeros(n)
    for h, a in [(1, 1.0), (2, 0.55), (3, 0.32), (4, 0.18), (5, 0.1), (6, 0.06)]:
        tone += a * np.sin(h * phase + 0.3 * h)
    rough = 1 + 0.35 * np.sign(np.sin(2 * np.pi * 95 * t)) * np.exp(-6 * k)  # aspereza al inicio del grito
    breath = band(rng.standard_normal(n), 2500, 7000) * 0.12
    e = env(n, 0.06, 0.55, 2.4)
    return (tone * rough + breath) * e * gain


def place(buf, x, at):
    i = int(SR * at)
    buf[i : i + len(x)] += x[: len(buf) - i]


total = 1.9
out = np.zeros(int(SR * total))
place(out, wing(0.34, 0.55), 0.00)
place(out, wing(0.30, 0.45), 0.30)
place(out, cry(0.62, 2350, 1500, 0.42), 0.52)
place(out, cry(0.30, 2050, 1600, 0.22), 1.18)  # segunda llamada, más corta

# Eco de montaña: dos reflexiones apagadas.
dry = out.copy()
for delay, g in [(0.23, 0.28), (0.47, 0.14)]:
    d = int(SR * delay)
    out[d:] += lowpass(dry, 3000)[: len(out) - d] * g

out = lowpass(out, 7500)
fade = int(SR * 0.12)
out[-fade:] *= np.linspace(1, 0, fade)
out /= np.max(np.abs(out)) + 1e-9
out *= 10 ** (-3 / 20)  # pico a -3 dBFS

stereo = np.stack([out, np.roll(out, int(SR * 0.004)) * 0.96], axis=1)  # un poco de amplitud
wavfile.write(sys.argv[1], SR, (stereo * 32767).astype(np.int16))
print("listo", len(out) / SR, "s")
