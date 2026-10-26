document.addEventListener('DOMContentLoaded', () => {
    const kpValEl = document.getElementById('kp-val');
    const windValEl = document.getElementById('wind-val');
    const flareValEl = document.getElementById('flare-val');

    // NOAA SWPC JSON endpoints (updated 2025)
    const KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json';
    const WIND_URL = 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json';
    const XRAY_URL = 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json';

    async function fetchSolarData() {
        // --- Kp Index ---
        try {
            const kpRes = await fetch(KP_URL);
            const kpData = await kpRes.json();
            // Format: array of objects [{time_tag, Kp, a_running, station_count}, ...]
            if (kpData && kpData.length > 0) {
                const latest = kpData[kpData.length - 1];
                const kpIndex = parseFloat(latest.Kp).toFixed(1);
                kpValEl.textContent = kpIndex;

                if (kpIndex >= 5) {
                    kpValEl.style.color = "var(--neon-red)";
                } else if (kpIndex >= 4) {
                    kpValEl.style.color = "var(--neon-orange)";
                } else {
                    kpValEl.style.color = "var(--neon-blue)";
                }
            }
        } catch (e) {
            console.error('Error fetching Kp Index:', e);
            kpValEl.textContent = 'ERR';
        }

        // --- Solar Wind Speed ---
        // Endpoint: /products/summary/solar-wind-speed.json
        // Format: [{proton_speed: 327, time_tag: "2026-10-26T13:41:00Z"}]
        try {
            const windRes = await fetch(WIND_URL);
            const windData = await windRes.json();
            if (windData && windData.length > 0) {
                const latest = windData[windData.length - 1];
                const speed = parseFloat(latest.proton_speed);
                if (!isNaN(speed)) {
                    windValEl.textContent = `${speed.toFixed(0)} km/s`;
                } else {
                    windValEl.textContent = '-- km/s';
                }
            }
        } catch (e) {
            console.error('Error fetching Solar Wind:', e);
            windValEl.textContent = 'ERR';
        }

        // --- X-Ray Flares (GOES) ---
        try {
            const xrayRes = await fetch(XRAY_URL);
            const xrayData = await xrayRes.json();

            if (xrayData && xrayData.length > 0) {
                const latest = xrayData[xrayData.length - 1];
                const flux = latest.flux;
                let flareClass = "A/B";

                if (flux >= 1e-4) flareClass = "X-CLASS";
                else if (flux >= 1e-5) flareClass = "M-CLASS";
                else if (flux >= 1e-6) flareClass = "C-CLASS";

                flareValEl.textContent = flareClass;

                if (flareClass === "X-CLASS" || flareClass === "M-CLASS") {
                    flareValEl.style.color = "var(--neon-red)";
                    flareValEl.style.animation = "blink 1s infinite";
                } else if (flareClass === "C-CLASS") {
                    flareValEl.style.color = "var(--neon-orange)";
                    flareValEl.style.animation = "";
                } else {
                    flareValEl.style.color = "var(--neon-blue)";
                    flareValEl.style.animation = "";
                }
            }
        } catch (e) {
            console.error('Error fetching X-Ray data:', e);
            flareValEl.textContent = 'ERR';
        }
    }

    // Initialize
    fetchSolarData();

    // Refresh every 5 minutes
    setInterval(fetchSolarData, 300000);
});
