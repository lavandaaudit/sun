/**
 * IBONARIUM SUNSET — app.js
 * Cameras: worldwatcher.live/cameras.json
 * Terminator logic: selects 10 cameras closest to local sunset at current UTC time.
 */

document.addEventListener('DOMContentLoaded', () => {
    const locationsGrid = document.getElementById('locations-grid');
    const videoContainer = document.getElementById('video-container');
    const currentLocationEl = document.getElementById('current-location');
    const currentTempEl = document.getElementById('current-temp');
    const sunsetCountdownEl = document.getElementById('sunset-countdown');
    const fsBtn = document.getElementById('fs-btn');
    const glassFrame = document.querySelector('.glass-frame');

    let allCameras = [];
    let currentCamera = null;
    let countdownInterval = null;

    // ─── Fullscreen ──────────────────────────────────────────────────────────
    if (fsBtn && glassFrame) {
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                (glassFrame.requestFullscreen || glassFrame.webkitRequestFullscreen || glassFrame.msRequestFullscreen).call(glassFrame);
                fsBtn.innerHTML = "⛶";
            } else {
                document.exitFullscreen && document.exitFullscreen();
                fsBtn.innerHTML = "⛶";
            }
        });
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) fsBtn.innerHTML = "⛶";
        });
    }

    // ─── Terminator / Sunset Math ─────────────────────────────────────────────
    /**
     * Calculates today's approximate solar noon for a given longitude (in UTC hours).
     * Returns the UTC hour of solar noon.
     */
    function solarNoonUTC(lon) {
        // Longitude → UTC offset in hours (rough, ignoring DST)
        return 12 - (lon / 15);
    }

    /**
     * Returns today's approximate UTC sunset hour for a given lat/lon.
     * Uses a simplified version of NOAA algorithm (good to ~5 min accuracy).
     */
    function sunsetUTC(lat, lon) {
        const now = new Date();
        const dayOfYear = Math.floor(
            (now - new Date(now.getFullYear(), 0, 0)) / 86400000
        );

        // Declination (degrees)
        const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));

        // Hour angle at sunset
        const latRad = lat * Math.PI / 180;
        const declRad = decl * Math.PI / 180;
        const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);

        // Polar day / polar night
        if (cosHourAngle < -1) return solarNoonUTC(lon); // polar day, sun never sets
        if (cosHourAngle > 1) return solarNoonUTC(lon) + 12; // polar night, ~midnight

        const hourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
        const sunsetHour = solarNoonUTC(lon) + (hourAngle / 15);

        return sunsetHour; // UTC hours (0-24 float)
    }

    /**
     * For a given camera, compute how many minutes from now until/since local sunset.
     * Negative = sunset already passed. Positive = still upcoming.
     * Returns the absolute value in minutes (closer = better).
     */
    function minutesFromSunset(lat, lon) {
        const utcHour = (new Date().getUTCHours()) + (new Date().getUTCMinutes() / 60);
        const sunsetH = sunsetUTC(lat, lon);
        const diffHours = sunsetH - utcHour;
        return diffHours * 60; // in minutes, signed
    }

    // ─── Select sunset cameras ────────────────────────────────────────────────
    /**
     * From all cameras, pick 10 that are closest to local sunset RIGHT NOW.
     * "Golden window" = ±90 minutes around sunset.
     * Prioritise cameras still BEFORE sunset (positive diff), then just-passed.
     */
    function selectSunsetCameras(cameras, count = 10) {
        const scored = cameras.map(cam => {
            const [lat, lon] = cam.coords;
            const minsFromSunset = minutesFromSunset(lat, lon);
            return { ...cam, minsFromSunset };
        });

        // Sort: prefer cameras where sunset is soonest (small positive diff first),
        // then recently-set cameras (small negative diff), then rest.
        scored.sort((a, b) => {
            const aPriority = scoreSunset(a.minsFromSunset);
            const bPriority = scoreSunset(b.minsFromSunset);
            return aPriority - bPriority;
        });

        return scored.slice(0, count);
    }

    /**
     * Score for sorting: closer to sunset window → lower number → higher priority.
     * Golden zone: -30 to +90 minutes around sunset.
     */
    function scoreSunset(mins) {
        // Already past sunset 0-60 min → priority 0-1
        if (mins >= -60 && mins <= 0) return Math.abs(mins);
        // Before sunset 0-90 min → priority 0-90 (best if ~30 min before)
        if (mins > 0 && mins <= 90) return mins;
        // Everything else sorted by distance from ±0
        return 1000 + Math.abs(mins);
    }

    // ─── YouTube embed ────────────────────────────────────────────────────────
    function getYouTubeId(url) {
        if (!url) return null;
        const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    function playCamera(cam) {
        currentCamera = cam;
        const ytId = getYouTubeId(cam.youtube);

        // Highlight active card
        document.querySelectorAll('.location-card').forEach(c => c.classList.remove('active'));
        const activeCard = document.querySelector(`.location-card[data-id="${cam.youtube}"]`);
        if (activeCard) activeCard.classList.add('active');

        if (ytId) {
            videoContainer.innerHTML = `
                <iframe
                    src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=1&rel=0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowfullscreen
                    style="width:100%;height:100%;border:none;">
                </iframe>`;
        } else {
            videoContainer.innerHTML = `<div class="loading-feed" style="color:var(--neon-red)">ВТРАТА СИГНАЛУ</div>`;
        }

        // Update HUD location
        currentLocationEl.textContent = cam.name.toUpperCase();
        currentTempEl.textContent = '';

        // Countdown to local sunset
        const [lat, lon] = cam.coords;
        if (countdownInterval) clearInterval(countdownInterval);

        function tick() {
            const mins = minutesFromSunset(lat, lon);
            if (mins < -90 || mins > 180) {
                sunsetCountdownEl.textContent = `ЗАХІД: ${Math.round(Math.abs(mins))} хв`;
                sunsetCountdownEl.style.color = 'var(--neon-blue)';
            } else if (mins > 0) {
                const h = Math.floor(mins / 60);
                const m = Math.floor(mins % 60);
                const s = Math.floor((mins % 1) * 60);
                const fmt = v => String(v).padStart(2, '0');
                sunsetCountdownEl.textContent = `ЗАХІД: -${h ? fmt(h) + ':' : ''}${fmt(m)}:${fmt(s)}`;
                sunsetCountdownEl.style.color = 'var(--neon-orange)';
            } else {
                sunsetCountdownEl.textContent = 'ЗАХІД: ТРИВАЄ ☀️';
                sunsetCountdownEl.style.color = 'var(--neon-red)';
            }
        }
        tick();
        countdownInterval = setInterval(tick, 1000);
    }

    // ─── Render sidebar cards ─────────────────────────────────────────────────
    function renderLocations(cameras) {
        locationsGrid.innerHTML = '';
        cameras.forEach(cam => {
            const card = document.createElement('div');
            card.className = 'location-card';
            card.dataset.id = cam.youtube;

            const ytId = getYouTubeId(cam.youtube);
            const thumb = ytId
                ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
                : 'https://via.placeholder.com/300x169?text=No+Signal';

            // Sunset timing label
            const mins = cam.minsFromSunset;
            let sunsetLabel = '';
            if (mins > 0 && mins <= 180) {
                sunsetLabel = `🌅 за ${Math.round(mins)} хв`;
            } else if (mins >= -60 && mins <= 0) {
                sunsetLabel = `🌇 ${Math.round(Math.abs(mins))} хв тому`;
            } else {
                sunsetLabel = `☀️ ${Math.round(Math.abs(mins / 60))} год`;
            }

            card.innerHTML = `
                <div class="loc-thumb" style="background-image:url('${thumb}')">
                    <div class="loc-quality">${sunsetLabel}</div>
                </div>
                <div class="loc-info">
                    <div class="loc-city">${cam.name.split(',')[0]}</div>
                    <div class="loc-country">${cam.name.split(',').slice(1).join(',').trim()}</div>
                    <div class="loc-sunset">SUNSET IN: ${mins > 0 ? Math.round(mins) + ' min' : 'NOW'}</div>
                </div>
            `;
            card.addEventListener('click', () => playCamera(cam));
            locationsGrid.appendChild(card);
        });
    }

    // ─── Main load & refresh ──────────────────────────────────────────────────
    async function loadAndRender() {
        try {
            if (allCameras.length === 0) {
                // First load: fetch from worldwatcher.live
                const res = await fetch('https://worldwatcher.live/cameras.json');
                allCameras = await res.json();
            }

            const sunsetCams = selectSunsetCameras(allCameras, 10);
            renderLocations(sunsetCams);

            // Auto-play first camera on initial load
            if (!currentCamera && sunsetCams.length > 0) {
                playCamera(sunsetCams[0]);
            }

            console.log(`[SANSET] Terminator update — top sunset cam: ${sunsetCams[0]?.name} (${Math.round(sunsetCams[0]?.minsFromSunset)} min to sunset)`);
        } catch (err) {
            console.error('Failed to load cameras:', err);
            videoContainer.innerHTML = `<div class="loading-feed" style="color:var(--neon-red)">СИСТЕМНА ПОМИЛКА: ${err.message}</div>`;
        }
    }

    // Initial load
    loadAndRender();

    // Re-rank cameras every 10 minutes (terminator moves ~150 km/10 min)
    setInterval(loadAndRender, 10 * 60 * 1000);
});
