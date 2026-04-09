import network
import urequests
import ujson
import ntptime
import time
from config import WIFI_SSID, WIFI_PASSWORD, SUPABASE_URL, SUPABASE_KEY

# ─── CONFIG ───────────────────────────────────────────────
TRUCK_ID      = "4ad56a60-79f7-4497-80c4-d996026534d6"
POST_INTERVAL = 2   # seconds between updates (set to 30 on LILYGO to save data)

# ─── SIMULATED PATH (Hwy 99, Lynnwood → Everett) ──────────
# Replace this entire block with real GPS reads when running on LILYGO
WAYPOINTS = [
    (47.8209, -122.2821),
    (47.8350, -122.2790),
    (47.8500, -122.2760),
    (47.8650, -122.2730),
    (47.8800, -122.2700),
    (47.8950, -122.2680),
    (47.9100, -122.2650),
    (47.9251, -122.2600),
    (47.9400, -122.2550),
    (47.9551, -122.2511),
]

# ─── HELPERS ──────────────────────────────────────────────
def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print("Connecting to Wi-Fi...")
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        while not wlan.isconnected():
            time.sleep(0.5)
            print(".", end="")
    print("\nConnected:", wlan.ifconfig()[0])

def sync_time():
    try:
        ntptime.settime()
        print("Time synced via NTP")
    except Exception as e:
        print("NTP sync failed:", e)

def iso_timestamp():
    t = time.localtime()
    return "{:04d}-{:02d}-{:02d}T{:02d}:{:02d}:{:02d}+00:00".format(
        t[0], t[1], t[2], t[3], t[4], t[5]
    )

# ─── SUPABASE ─────────────────────────────────────────────
def update_location(lat, lng):
    url = "{}/rest/v1/truck_locations?truck_id=eq.{}".format(SUPABASE_URL, TRUCK_ID)
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    payload = ujson.dumps({
        "latitude": lat,
        "longitude": lng,
        "recorded_at": iso_timestamp()
    })
    try:
        res = urequests.patch(url, headers=headers, data=payload)
        print("({}, {}) → HTTP {}".format(lat, lng, res.status_code))
        res.close()
    except Exception as e:
        print("Error posting location:", e)

# ─── MAIN ─────────────────────────────────────────────────
connect_wifi()
sync_time()

i = 0
while True:
    lat, lng = WAYPOINTS[i % len(WAYPOINTS)]
    update_location(lat, lng)
    i += 1
    time.sleep(POST_INTERVAL)