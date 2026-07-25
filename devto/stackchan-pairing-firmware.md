---
title: M5 StackChan pairing fails with No devices found — the factory firmware is the cause
published: true
description: The app said no devices were found, but the BLE connection and handshake had actually succeeded. The real cause was 9-versions-old factory firmware, and OTA was unreachable by design. Here is how to flash the official firmware over USB without M5Burner.
tags: m5stack, esp32, iot, ble
---

## TL;DR

I bought the official M5Stack StackChan (`M5STACK-K151`), and the "StackChan World" mobile app refused to finish setup: after selecting the device, it showed **`No devices found`**.

The cause was **not Bluetooth permissions and not an app bug — the factory firmware was simply too old**. After flashing the latest official firmware over USB, pairing went through on the first attempt.

What makes this worth writing about is that the situation is **a closed loop you cannot escape on the device itself**:

- New firmware arrives via OTA
- OTA needs Wi-Fi
- Wi-Fi setup needs app pairing
- **Pairing fails on the old firmware**

So **flashing over USB is the only way out**.

## Environment and dates

| | |
|---|---|
| Product | M5StackChan AI Desktop Robot (ESP32-S3) / `M5STACK-K151` (official assembled unit) |
| Purchased | 2026-07-24 (Switch Science, Japan) |
| Setup attempted | 2026-07-25 |
| Factory firmware on the unit | **1.2.4** (released 2026-04-20) |
| Latest official firmware that day | **1.4.4** (released 2026-07-13) |
| Host | Windows 11 |
| Phone | Android |

**The dates matter here.** This product launched in 2026-05 and both the firmware and the app are still being updated frequently. **The firmware version that ships with a unit depends on when you buy it**, so whether you hit this problem depends on timing. If you buy stock that has been sitting for a few months, you are a good candidate for the same trap.

## The symptom

The setup flow is:

1. Power on, pass the servo test
2. The device shows a 12-digit ID
3. In the app: "Add a new StackChan" → scan for nearby devices
4. Pick the entry matching the ID on the device screen
5. Set device name → AI agent → Wi-Fi

**Step 4 immediately produced `No devices found`**, and step 5 was never reachable.

## What did not help

The message talks about devices not being found, so of course I attacked discovery first. None of this changed anything:

- Granting Bluetooth and location permissions to the app (verified from the OS settings, not just the in-app prompt)
- Turning location services on (BLE scanning on Android is entangled with location)
- Force-stopping and restarting the app, rebooting the phone
- Rebooting the device, returning to the ID screen before scanning
- Toggling Bluetooth off and on

One thing I learned the hard way: **do not pair from the OS Bluetooth settings screen.** If you bond the device at the OS level, it gets registered as a known device and **disappears from the app's "find a new device" list**. I did exactly this while "just checking", which made the picture even muddier. If you already did it, remove the pairing.

## The serial log told a completely different story

I stopped guessing about permissions and captured the USB serial log. When you connect the unit to a PC, the CoreS3 (ESP32-S3) native USB shows up as a serial port (`VID_303A` / `PID_1001`, USB-Serial/JTAG).

Here is what the log showed while the app was "not finding" anything:

```
I (111140) NimBLE: connection established; status=0
I (111160) NimBLE:  peer_ota_addr_type=1 peer_ota_addr=
I (111160) NimBLE: 63:a2:04:c7:fa:5d
[info] [WifiConfigServer] app Connected
I (112260) NimBLE: Stack-Chan characteristic write; conn_handle=1 attr_handle=22
I (112260) NimBLE: Config data received (42 bytes): {"cmd":"handshake","data":"1784964126892"}
I (112420) NimBLE: GATT procedure initiated: notify;
I (112430) NimBLE: notify_tx event; conn_handle=1 attr_handle=22 status=0 is_indication=0
I (112440) NimBLE: Config notification sent
```

Reading that:

- **The BLE connection was established** (`status=0`)
- **The app was connected** (`app Connected`)
- **The app sent a handshake** (`{"cmd":"handshake"}`)
- **The device answered** (`Config notification sent`)
- And then **nothing more arrives from the app** — not even a disconnect

So `No devices found` did not describe reality. The process was not failing at **discovery**; it was failing at **verification of the response the device sent back**. Trusting that message is what sent me down the permissions rabbit hole.

For confirmation I read the app side too. The firmware, the app, and the server for StackChan are all published in [m5stack/StackChan](https://github.com/m5stack/StackChan) — the Flutter app source lives in the same repository. The device-selection screen has a 30-second connect timeout and a 20-second verification timeout, with failure messages such as `Device did not return encryption data.` and `Device verification decryption failed.`, and it registers the device with the server only after verification succeeds.

## Root cause: firmware version, plus a deadlock

The boot log prints the version:

```
I (690) app_init: Project name:     stack-chan
I (696) app_init: App version:      1.2.4
I (700) app_init: Compile time:     Apr 15 2026 09:18:33
```

**1.2.4**, while the latest official build that day was **1.4.4** — nine versions apart.

And that is where the loop from the top of this post bites: OTA needs Wi-Fi, Wi-Fi needs pairing, pairing fails on old firmware. **USB is the only remaining path.**

Note that **building the firmware yourself does not help**. The handshake implementation in the public repository (`firmware/main/hal/utils/secret_logic/secret_logic.cpp`) is a stub whose token function returns a fixed string. It is declared as a weak symbol, and the real implementation is linked in at official build time. **Only the official binary can satisfy the app's verification step.**

## The fix: flash the official firmware over USB, without M5Burner

The official flashing tool is M5Burner (a GUI), but **the firmware distribution API it uses is public**, so the whole thing can be done from the CLI. No Python required either.

### 1. List the official firmware versions

```bash
curl -s "https://m5burner-api.m5stack.com/api/firmware" \
  | jq -r '.[] | select(.name=="StackChan-UserDemo") | .versions[] | "\(.version)  \(.published_at)  \(.file)"'
```

The factory firmware is named **`StackChan-UserDemo`** (author: M5Stack):

```
V1.2.4   2026-04-20  3c8ffe6be0ca26375d836e10e06e3609.bin
V1.4.3   2026-07-02  fb75fa818e63b7ee6b0d35eba308f386.bin
V1.4.4   2026-07-13  790e3fcde496020aa7f188153b23e6f0.bin
```

Older versions stay available, so **rolling back is possible too** — which makes updating a lot less scary.

### 2. Download the binary

```bash
curl -sL "https://m5burner-cdn.m5stack.com/firmware/790e3fcde496020aa7f188153b23e6f0.bin" \
  -o stackchan-v1.4.4.bin
```

If the first byte is `e9` (the ESP image magic), it is a merged full image to be written at offset `0x0`:

```bash
od -An -tx1 -N 1 stackchan-v1.4.4.bin
#  e9
```

### 3. Get esptool (no Python needed)

Espressif ships standalone executables:

```bash
gh api repos/espressif/esptool/releases/latest \
  --jq '.assets[] | select(.name|test("windows-amd64")) | .browser_download_url'
```

### 4. Verify communication with a read-only command first

```powershell
.\esptool.exe --port COM3 flash-id
```

```
Detecting chip type... ESP32-S3
Chip type:          ESP32-S3 (QFN56) (revision v0.2)
USB mode:           USB-Serial/JTAG
Detected flash size: 16MB
```

**No manual download mode was necessary** — esptool resets the chip through USB-Serial/JTAG. If it cannot connect, hold the reset button for about 2 seconds and release it once the internal green LED lights up.

### 5. Flash

```powershell
.\esptool.exe --port COM3 write-flash 0x0 stackchan-v1.4.4.bin
```

```
Wrote 12783792 bytes (3185393 compressed) at 0x00000000 in 47.7 seconds
Verifying written data...
Hash of data verified.
```

About 50 seconds for just under 12.8 MB.

### 6. Confirm the version

Look for `app_init: App version: 1.4.4` in the boot log. With that in place, pairing succeeded on the first try, and I went straight through AI agent setup, Wi-Fi setup, and an actual voice conversation.

## Other traps worth knowing

### Opening the serial port reboots the device

```
rst:0x15 (USB_UART_CHIP_RESET),boot:0x2b (SPI_FAST_FLASH_BOOT)
```

**You cannot capture logs and operate the device at the same time.** Opening the port in the middle of the setup wizard sends you back to the start (it did for me). The flip side is useful: if you want the boot log from the very first line, open the port and then trigger a reset.

### There is no interactive serial console

Sending commands produces no response, and the write itself blocks. Treat the serial port as read-only.

### Do not power both USB-C ports at once

The unit has a USB-C port on the CoreS3 and another on the heel (base). 5V fed into the CoreS3 side is routed to the base through the M-BUS `BUS_5V` line, so **powering both ports puts two supplies on the same rail**. The official documentation's "try powering from both ports" means one at a time. The heel port is the recommended one for power and flashing.

### Servo zero positions survive a full flash erase

I backed up NVS before flashing, but the same zero positions were read back afterwards (`[ScsServo] id: 1 get zero pos: 460 from settings`). **Those values appear to live in the servos themselves**, so a full-flash rewrite does not lose them.

## A separate warning about charging

The firmware sets the AXP2101 charge current to **700mA** at boot:

```cpp
auto ret = setChargerConstantCurr(XPOWERS_AXP2101_CHG_CUR_700MA);
```

The ESP32-S3 enumerates as a USB 2.0 device, so **a PC USB port gives you 500mA at most**. Combined with the system draw (LCD, camera, servos, radio) that exceeds the input limit, and **charging never starts from a PC port**. Use a USB charger with headroom at 5V.

If the servos do not report their current position (`[ScsServo] ignore invalid current pos: -1`), read that as another sign of insufficient power.

## Takeaways

- `No devices found` **did not describe what was happening**. The BLE connection and the handshake both succeeded; the failure was in response verification
- The real cause was **old factory firmware**, fixed by flashing the latest official build over USB
- OTA ↔ Wi-Fi ↔ pairing form a loop, so **USB flashing is the only exit**
- **Do not over-trust the error string — capture the log.** Every minute I spent re-checking permissions would have been saved by one serial capture

Scripts and the full write-up are in the repository:

- https://github.com/yasumorishima/stackchan-lab

### References

- Official docs: https://docs.m5stack.com/en/stackchan
- Firmware / app / server source: https://github.com/m5stack/StackChan
