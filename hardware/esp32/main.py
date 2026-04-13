import machine
import time
import ujson
from config import SUPABASE_URL, SUPABASE_KEY

# ─── CONFIG ───────────────────────────────────────────────
TRUCK_ID      = "4ad56a60-79f7-4497-80c4-d996026534d6"
POST_INTERVAL = 30

# ─── SIM7600 UART PINS ────────────────────────────────────
UART_TX  = 27
UART_RX  = 26
PWR_PIN  = 4

uart = machine.UART(1, baudrate=115200, tx=UART_TX, rx=UART_RX, timeout=1000)

# ─── MODEM HELPERS ────────────────────────────────────────
def pwr_on():
    pwr = machine.Pin(PWR_PIN, machine.Pin.OUT)
    pwr.value(1)
    time.sleep(2)
    pwr.value(0)
    print("Power key toggled, waiting for modem boot...")
    time.sleep(5)

def send_at(cmd, timeout=5, expect="OK"):
    uart.write((cmd + "\r\n").encode())
    t0 = time.time()
    resp = b""
    while time.time() - t0 < timeout:
        chunk = uart.read(256)
        if chunk:
            resp += chunk
        if expect.encode() in resp or b"ERROR" in resp:
            break
        time.sleep(0.1)
    decoded = resp.decode("utf-8", "ignore").strip()
    print("[AT] {} → {}".format(cmd, decoded[:120]))
    return decoded

def wait_for(pattern, timeout=45):
    """Wait for an unsolicited response containing pattern."""
    t0 = time.time()
    buf = b""
    while time.time() - t0 < timeout:
        chunk = uart.read(256)
        if chunk:
            buf += chunk
            print("[URC] {}".format(buf.decode("utf-8", "ignore").strip()[-80:]))
        if pattern.encode() in buf:
            break
        time.sleep(0.2)
    return buf.decode("utf-8", "ignore").strip()

def sync_rtc_from_modem():
    """Read time from modem network time and set ESP32 RTC."""
    for attempt in range(10):
        r = send_at('AT+CCLK?', timeout=5)
        if '"' in r:
            break
        print("Clock read attempt {}/10, retrying...".format(attempt + 1))
        time.sleep(2)
    try:
        start = r.index('"') + 1
        end = r.index('"', start)
        t = r[start:end]
        date, rest = t.split(",")
        yy, mo, dd = date.split("/")
        time_part = rest[:8]
        hh, mm, ss = time_part.split(":")
        year = 2000 + int(yy)
        rtc = machine.RTC()
        rtc.datetime((year, int(mo), int(dd), 0, int(hh), int(mm), int(ss), 0))
        print("RTC synced: {}-{}-{} {}:{}:{}".format(year, mo, dd, hh, mm, ss))
    except Exception as e:
        print("RTC sync failed:", e)

# ─── MODEM INIT ───────────────────────────────────────────
def init_modem():
    print("=== Modem Init ===")
    pwr_on()

    for attempt in range(15):
        if "OK" in send_at("AT"):
            break
        print("Waiting for modem... ({}/15)".format(attempt + 1))
        time.sleep(1)
    else:
        raise RuntimeError("Modem not responding")

    send_at("ATE0")
    send_at("AT+CMEE=2")
    send_at('AT+CGDCONT=1,"IP","hologram"')
    send_at("AT+COPS=0", timeout=15)

    print("Checking SIM...")
    for _ in range(10):
        r = send_at("AT+CPIN?")
        if "READY" in r:
            print("SIM ready")
            break
        time.sleep(2)
    else:
        raise RuntimeError("SIM not ready")

    print("Waiting for network registration...")
    for _ in range(30):
        r = send_at("AT+CREG?")
        if ",1" in r or ",5" in r:
            print("Registered on network")
            break
        time.sleep(2)
    else:
        raise RuntimeError("Network registration failed")

    send_at("AT+CGACT=1,1", timeout=15)

    # Drain URCs for full 20 seconds — modem floods after CGACT
    print("Waiting for modem to settle...")
    t0 = time.time()
    while time.time() - t0 < 20:
        uart.read(1024)
        time.sleep(0.5)
    print("Resuming...")

    # Set Google DNS
    send_at('AT+CDNSCFG="8.8.8.8","8.8.4.4"')

    # Verify DNS works
    send_at('AT+CDNSGIP="tsnobtgthhyccyfjeabo.supabase.co"', timeout=10, expect="+CDNSGIP")

    # Sync ESP32 RTC from modem network time
    sync_rtc_from_modem()

    # Configure SSL
    send_at('AT+CSSLCFG="sslversion",1,3')    # TLS 1.2
    send_at('AT+CSSLCFG="authmode",1,0')       # No client cert
    send_at('AT+CSSLCFG="enableSNI",1,1')      # Enable SNI

    print("=== Modem Ready ===")

# ─── GPS ──────────────────────────────────────────────────
def init_gps():
    send_at("AT+CGPS=1,1", timeout=5)
    print("GPS enabled — go near a window for first fix")

def nmea_to_decimal(raw, direction):
    dot = raw.index(".")
    degrees = float(raw[:dot - 2])
    minutes = float(raw[dot - 2:])
    decimal = degrees + minutes / 60.0
    if direction in ("S", "W"):
        decimal = -decimal
    return decimal

def get_gps():
    r = send_at("AT+CGPSINFO", timeout=5, expect="+CGPSINFO")
    for line in r.split("\n"):
        if "+CGPSINFO:" in line:
            data = line.split(":", 1)[1].strip()
            parts = data.split(",")
            if len(parts) >= 4 and parts[0].strip():
                try:
                    lat = nmea_to_decimal(parts[0].strip(), parts[1].strip())
                    lng = nmea_to_decimal(parts[2].strip(), parts[3].strip())
                    return lat, lng
                except Exception as e:
                    print("GPS parse error:", e)
    return None

# ─── TIMESTAMP ────────────────────────────────────────────
def iso_timestamp():
    t = time.localtime()
    if t[0] < 2024:
        print("Warning: RTC not synced")
        return "2026-04-13T00:00:00+00:00"
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}+00:00".format(
        t[0], t[1], t[2], t[3], t[4], t[5]
    )

# ─── SUPABASE VIA SIM7600 AT HTTP ─────────────────────────
def update_location(lat, lng):
    url = "{}/rest/v1/truck_locations?on_conflict=truck_id&apikey={}".format(
        SUPABASE_URL, SUPABASE_KEY
    )
    body = ujson.dumps({
        "truck_id":    TRUCK_ID,
        "latitude":    lat,
        "longitude":   lng,
        "recorded_at": iso_timestamp()
    })
    body_len = len(body)

    send_at("AT+HTTPTERM", timeout=5)
    time.sleep(2)
    send_at("AT+HTTPINIT", timeout=5)
    send_at('AT+HTTPPARA="CID",1')
    send_at('AT+HTTPPARA="SSLCFG",1')
    send_at('AT+HTTPPARA="URL","{}"'.format(url))
    send_at('AT+HTTPPARA="CONTENT","application/json"')
    send_at('AT+HTTPPARA="USERDATA","Prefer: resolution=merge-duplicates"')

    r = send_at('AT+HTTPDATA={},5000'.format(body_len), timeout=5, expect="DOWNLOAD")
    if "DOWNLOAD" not in r:
        print("HTTPDATA not ready, aborting")
        send_at("AT+HTTPTERM")
        return

    uart.write(body.encode())
    time.sleep(1)

    uart.read(256)
    time.sleep(0.1)
    uart.write(b"AT+HTTPACTION=1\r\n")
    result = wait_for("+HTTPACTION", timeout=45)
    print("({:.5f}, {:.5f}) → {}".format(lat, lng, result))

    if "204" not in result and "200" not in result:
        send_at("AT+HTTPREAD=0,500", timeout=5)

    send_at("AT+HTTPTERM", timeout=5)
    time.sleep(2)

# ─── MAIN ─────────────────────────────────────────────────
init_modem()
init_gps()

while True:
    fix = get_gps()
    if fix:
        lat, lng = fix
        update_location(lat, lng)
    else:
        print("No GPS fix yet — retrying in {}s".format(POST_INTERVAL))
    time.sleep(POST_INTERVAL)