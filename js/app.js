/**
 * IBONARIUM SUNSET — app.js
 * Cameras: worldwatcher.live (embedded + proxy fallback)
 * Terminator logic: selects 10 cameras closest to local sunset at current UTC time.
 */

// ─── Embedded camera data (from worldwatcher.live/cameras.json) ───────────────
// Embedded to avoid CORS issues. Update periodically from worldwatcher.live/cameras.json
const CAMERAS_EMBEDDED = [
  { name: "The Beach Bar, St. John, US Virgin Islands", coords: [18.330417, -64.796084], youtube: "https://www.youtube.com/watch?v=2wqpy036z24" },
  { name: "Kabukicho, Tokyo, Japan", coords: [35.694312, 139.701184], youtube: "https://www.youtube.com/watch?v=gFRtAAmiFbE" },
  { name: "Centraal Station, Amsterdam, Netherlands", coords: [52.378592, 4.896342], youtube: "https://www.youtube.com/watch?v=1phWWCgzXgM" },
  { name: "Lamai Beach, Koh Samui, Thailand", coords: [9.458424, 100.042551], youtube: "https://www.youtube.com/watch?v=Tpj0cmMVOd0" },
  { name: "Gondwana Namib Park, Namibia", coords: [-24.074935, 15.887342], youtube: "https://www.youtube.com/watch?v=ydYDqZQpim8" },
  { name: "Levi Ski Resort, Finland", coords: [67.803993, 24.808625], youtube: "https://www.youtube.com/watch?v=LwihxyJ4V20" },
  { name: "Santa Claus Village, Rovaniemi, Finland", coords: [66.543549, 25.846505], youtube: "https://www.youtube.com/watch?v=Cp4RRAEgpeU" },
  { name: "Venice Beach, Los Angeles, USA", coords: [33.988578, -118.475099], youtube: "https://www.youtube.com/watch?v=3LXQWU67Ufk" },
  { name: "Nevsky Avenue, St. Petersburg, Russia", coords: [59.934783, 30.331925], youtube: "https://www.youtube.com/watch?v=h1wly909BYw" },
  { name: "Central Memorial Parks, Calgary, Canada", coords: [51.040559, -114.070312], youtube: "https://www.youtube.com/watch?v=xsRDTfuksyI" },
  { name: "Europa Square, Abetone, Italy", coords: [44.144415, 10.665136], youtube: "https://www.youtube.com/watch?v=fjnJ2fzlh4g" },
  { name: "Cap Blanc Beach, Alicante, Spain", coords: [38.577653, -0.064434], youtube: "https://www.youtube.com/watch?v=mdOqWWUxIJw" },
  { name: "Boulevard du Midi, Cannes, France", coords: [43.539299, 6.957370], youtube: "https://www.youtube.com/watch?v=z6BNMoj9Pyo" },
  { name: "Lekeitio Marina, Lekeitio, Spain", coords: [43.363996, -2.502884], youtube: "https://www.youtube.com/watch?v=KTvzATgyRik" },
  { name: "Geiranger cruise port, Norway", coords: [62.102312, 7.205131], youtube: "https://www.youtube.com/watch?v=yMSc-qqW3To" },
  { name: "Escala25, Lisbon, Portugal", coords: [38.700401, -9.179565], youtube: "https://www.youtube.com/watch?v=Ja6Lw8311Jk" },
  { name: "Times Square, New York City, USA", coords: [40.759230, -73.985299], youtube: "https://www.youtube.com/watch?v=rnXIjl_Rzy4" },
  { name: "Dam Square, Amsterdam, Netherlands", coords: [52.372549, 4.894063], youtube: "https://www.youtube.com/watch?v=Gd9d4q6WvUY" },
  { name: "Abbey Road, London, United Kingdom", coords: [51.532176, -0.177541], youtube: "https://www.youtube.com/watch?v=57w2gYXjRic" },
  { name: "Essex Street, Dublin, Ireland", coords: [53.345565, -6.264354], youtube: "https://www.youtube.com/watch?v=u4UZ4UvZXrg" },
  { name: "Zandvoort Beach, Netherlands", coords: [52.375750, 4.528659], youtube: "https://www.youtube.com/watch?v=UsQ_I3DRpxs" },
  { name: "Praça da Ribeira, Porto, Portugal", coords: [41.140183, -8.614623], youtube: "https://www.youtube.com/watch?v=jSmPUv48IYc" },
  { name: "Maspalomas, Canary Islands, Spain", coords: [27.757778, -15.577416], youtube: "https://www.youtube.com/watch?v=o09siXxJw9A" },
  { name: "8 Street, Canmore, Canada", coords: [51.089140, -115.361357], youtube: "https://www.youtube.com/watch?v=_0wPODlF9wU" },
  { name: "Tobalaba, Santiago, Chile", coords: [-33.418041, -70.602108], youtube: "https://www.youtube.com/watch?v=cAjWS3GsNSk" },
  { name: "Palace of Iéna, Paris, France", coords: [48.863775, 2.292127], youtube: "https://www.youtube.com/watch?v=OzYp4NRZlwQ" },
  { name: "St. George Street, St. Augustine, USA", coords: [29.896149, -81.313177], youtube: "https://www.youtube.com/watch?v=ZksWoEAhmTU" },
  { name: "Kirribilli, Sydney, Australia", coords: [-33.848282, 151.214639], youtube: "https://www.youtube.com/watch?v=5uZa3-RMFos" },
  { name: "Hotel Fairmont The Palm, Dubai, UAE", coords: [25.109748, 55.140517], youtube: "https://www.youtube.com/watch?v=7dE4IjDQJmE" },
  { name: "Henry Africa's Bar, Koh Samui, Thailand", coords: [9.532220, 100.063452], youtube: "https://www.youtube.com/watch?v=6MMXJrzT5c0" },
  { name: "Chaweng Beach Road, Koh Samui, Thailand", coords: [9.531924, 100.063131], youtube: "https://www.youtube.com/watch?v=VR-x3HdhKLQ" },
  { name: "Al-Aqsa, Jerusalem, Israel", coords: [31.776077, 35.233474], youtube: "https://www.youtube.com/watch?v=0jEa0FOw6vE" },
  { name: "Siesta Beach, Siesta Key, USA", coords: [27.265660, -82.550497], youtube: "https://www.youtube.com/watch?v=NLhxcyzXQxM" },
  { name: "Brión Square, Willemstad, Curaçao", coords: [12.107070, -68.936394], youtube: "https://www.youtube.com/watch?v=28U-t3fA9ks" },
  { name: "LionsDive Beach Resort, Curaçao", coords: [12.085228, -68.898149], youtube: "https://www.youtube.com/watch?v=loHbMM9JfCs" },
  { name: "Manchebo Beach, Oranjestad, Aruba", coords: [12.543703, -70.061208], youtube: "https://www.youtube.com/watch?v=_ZXMjk5K0_s" },
  { name: "Clifton 4th Beach, Cape Town, South Africa", coords: [-33.940996, 18.375925], youtube: "https://www.youtube.com/watch?v=pMhXWpyUhsk" },
  { name: "Nkorho Bush Lodge, Sabie Park, South Africa", coords: [-24.731664, 31.598255], youtube: "https://www.youtube.com/watch?v=7x9gIY63FEw" },
  { name: "Nuuk Airport, Nuuk, Greenland", coords: [64.191696, -51.674852], youtube: "https://www.youtube.com/watch?v=MApnQlsX5AQ" },
  { name: "Baykalsk, Russia", coords: [51.521010, 104.149876], youtube: "https://www.youtube.com/watch?v=VTqCNoIS8dY" },
  { name: "Naledi Lodge, Olifants West, South Africa", coords: [-24.207391, 30.891189], youtube: "https://www.youtube.com/watch?v=QGvjAPzImR8" },
  { name: "Elewana Tortilis Camp, Amboseli, Kenya", coords: [-2.684157, 37.182276], youtube: "https://www.youtube.com/watch?v=Zdbqms-gCnw" },
  { name: "Marshes of Orueta, Zelaieta, Spain", coords: [43.348494, -2.658767], youtube: "https://www.youtube.com/watch?v=AIj65bo5KTs" },
  { name: "Baccaro Point Lighthouse, Nova Scotia, Canada", coords: [43.450064, -65.470804], youtube: "https://www.youtube.com/watch?v=5mYXkctDMsA" },
  { name: "Hawk Veterans Memorial, Cape Sable Island, Canada", coords: [43.413192, -65.625011], youtube: "https://www.youtube.com/watch?v=Qz-jJ4mxMtU" },
  { name: "Hòn Chồng beach, Nha Trang, Vietnam", coords: [12.274231, 109.202136], youtube: "https://www.youtube.com/watch?v=SCpZOgLKVfY" },
  { name: "Bryant Park, New York City, USA", coords: [40.753670, -73.983387], youtube: "https://www.youtube.com/watch?v=809RMryNnlM" },
  { name: "Bourbon Street, New Orleans, USA", coords: [29.958735, -90.065608], youtube: "https://www.youtube.com/watch?v=86-7Dr7yeVQ" },
  { name: "Manarola Marina, Manarola, Italy", coords: [44.106708, 9.727195], youtube: "https://www.youtube.com/watch?v=Xmv0LbyZPVU" },
  { name: "Ponte delle Guglie, Venice, Italy", coords: [45.444051, 12.325131], youtube: "https://www.youtube.com/watch?v=HpZAez2oYsA" },
  { name: "Lyall Bay, Wellington, New Zealand", coords: [-41.329394, 174.787285], youtube: "https://www.youtube.com/watch?v=BfCQIhmK6OE" },
  { name: "Causeway Bay, Hong Kong, China", coords: [22.286217, 114.190000], youtube: "https://www.youtube.com/watch?v=vEbMHUMaMVs" },
  { name: "Longos Harbor, Paxos, Greece", coords: [39.226136, 20.161167], youtube: "https://www.youtube.com/watch?v=2qW4HNcAHk8" },
  { name: "Crescent Harbor, Sitka, USA", coords: [57.050048, -135.333381], youtube: "https://www.youtube.com/watch?v=h38bnKKIlGY" },
  { name: "Kos Harbour, Kos, Greece", coords: [36.894383, 27.288854], youtube: "https://www.youtube.com/watch?v=Gzl2M_eGpfM" },
  { name: "Rodrigo de Freitas Lagoon, Rio de Janeiro, Brazil", coords: [-22.952158, -43.213571], youtube: "https://www.youtube.com/watch?v=c-ichH4bid0" },
  { name: "Pepino Beach, Rio de Janeiro, Brazil", coords: [-23.001060, -43.272279], youtube: "https://www.youtube.com/watch?v=UE_MNlfWqMc" },
  { name: "Avenida Atlantica, Balneário Camboriú, Brazil", coords: [-26.987715, -48.631646], youtube: "https://www.youtube.com/watch?v=1F8jKY4rZl0" },
  { name: "Soliman Street, Davao City, Philippines", coords: [7.080946, 125.623477], youtube: "https://www.youtube.com/watch?v=p0Qhe4vhYLQ" },
  { name: "Leon Garcia Sr., Davao City, Philippines", coords: [7.081826, 125.624797], youtube: "https://www.youtube.com/watch?v=Io9oe3BL7ck" },
  { name: "Main Street, Cavalier, USA", coords: [48.793821, -97.623823], youtube: "https://www.youtube.com/watch?v=3VYf3klCwbM" },
  { name: "The Sphere, Las Vegas, USA", coords: [36.132534, -115.158289], youtube: "https://www.youtube.com/watch?v=YUyOm2pnk6c" },
  { name: "Þorbjörn, Southern Peninsula, Iceland", coords: [63.864151, -22.438363], youtube: "https://www.youtube.com/watch?v=8VjPqa2go6o" }
];

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

    // ─── Fullscreen ───────────────────────────────────────────────────────────
    if (fsBtn && glassFrame) {
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                (glassFrame.requestFullscreen || glassFrame.webkitRequestFullscreen || glassFrame.msRequestFullscreen).call(glassFrame);
            } else {
                document.exitFullscreen && document.exitFullscreen();
            }
        });
        document.addEventListener('fullscreenchange', () => {
            fsBtn.innerHTML = "⛶";
        });
    }

    // ─── Terminator / Sunset Math ─────────────────────────────────────────────
    function solarNoonUTC(lon) {
        return 12 - (lon / 15);
    }

    function sunsetUTC(lat, lon) {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now - start) / 86400000);

        const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
        const latRad = lat * Math.PI / 180;
        const declRad = decl * Math.PI / 180;
        const cosH = -Math.tan(latRad) * Math.tan(declRad);

        if (cosH < -1) return solarNoonUTC(lon);          // polar day
        if (cosH > 1)  return solarNoonUTC(lon) + 12;     // polar night

        const hourAngle = Math.acos(cosH) * 180 / Math.PI;
        return solarNoonUTC(lon) + (hourAngle / 15);       // UTC hours
    }

    function minutesFromSunset(lat, lon) {
        const utcNow = new Date();
        const utcHour = utcNow.getUTCHours() + utcNow.getUTCMinutes() / 60 + utcNow.getUTCSeconds() / 3600;
        return (sunsetUTC(lat, lon) - utcHour) * 60;      // positive = sunset upcoming
    }

    // ─── Select 10 sunset cameras ─────────────────────────────────────────────
    function scoreSunset(mins) {
        // Golden zone: -30..0 min (just set) → score 0..30
        if (mins >= -30 && mins <= 0)  return Math.abs(mins);
        // Approaching sunset 0..90 min → score 30..120
        if (mins > 0  && mins <= 90)   return 30 + mins;
        // Wider window ±3h
        if (mins > -180 && mins < 0)   return 150 + Math.abs(mins);
        // Everything else
        return 1000 + Math.abs(mins);
    }

    function selectSunsetCameras(cameras, count = 10) {
        return cameras
            .map(cam => ({
                ...cam,
                minsFromSunset: minutesFromSunset(cam.coords[0], cam.coords[1])
            }))
            .sort((a, b) => scoreSunset(a.minsFromSunset) - scoreSunset(b.minsFromSunset))
            .slice(0, count);
    }

    // ─── YouTube helpers ──────────────────────────────────────────────────────
    function getYouTubeId(url) {
        if (!url) return null;
        const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    // ─── Play camera ──────────────────────────────────────────────────────────
    function playCamera(cam) {
        currentCamera = cam;
        const ytId = getYouTubeId(cam.youtube);

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

        currentLocationEl.textContent = cam.name.toUpperCase();
        currentTempEl.textContent = '';

        // ─── Sunset countdown ─────────────────────────────────────────────────
        if (countdownInterval) clearInterval(countdownInterval);

        function tick() {
            const mins = minutesFromSunset(cam.coords[0], cam.coords[1]);
            if (mins > 0) {
                const h = Math.floor(mins / 60);
                const m = Math.floor(mins % 60);
                const s = Math.floor((mins * 60) % 60);
                const fmt = v => String(v).padStart(2, '0');
                const label = h > 0 ? `${fmt(h)}:${fmt(m)}:${fmt(s)}` : `${fmt(m)}:${fmt(s)}`;
                sunsetCountdownEl.textContent = `🌅 ЗАХІД: -${label}`;
                sunsetCountdownEl.style.color = mins < 30 ? 'var(--neon-red)' : 'var(--neon-orange)';
            } else if (mins >= -60) {
                sunsetCountdownEl.textContent = '🌇 ЗАХІД ЗАРАЗ';
                sunsetCountdownEl.style.color = 'var(--neon-red)';
            } else {
                const h = Math.floor(Math.abs(mins) / 60);
                const m = Math.floor(Math.abs(mins) % 60);
                sunsetCountdownEl.textContent = `☀️ ${h > 0 ? h + ' год ' : ''}${m} хв тому`;
                sunsetCountdownEl.style.color = 'var(--neon-blue)';
            }
        }
        tick();
        countdownInterval = setInterval(tick, 1000);
    }

    // ─── Render sidebar ───────────────────────────────────────────────────────
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

            const mins = cam.minsFromSunset;
            let sunsetLabel, labelColor;
            if (mins > 0 && mins <= 90) {
                sunsetLabel = `🌅 за ${Math.round(mins)} хв`;
                labelColor = mins < 30 ? '#ff003c' : '#ff5500';
            } else if (mins >= -60 && mins <= 0) {
                sunsetLabel = `🌇 ${Math.round(Math.abs(mins))} хв тому`;
                labelColor = '#ff5500';
            } else {
                sunsetLabel = `☀️ ${Math.round(Math.abs(mins / 60))} год`;
                labelColor = '#00f3ff';
            }

            const parts = cam.name.split(',');
            const city = parts[0].trim();
            const country = parts.slice(1).join(',').trim();

            card.innerHTML = `
                <div class="loc-thumb" style="background-image:url('${thumb}')">
                    <div class="loc-quality" style="color:${labelColor};border-color:${labelColor}">${sunsetLabel}</div>
                </div>
                <div class="loc-info">
                    <div class="loc-city">${city}</div>
                    <div class="loc-country">${country}</div>
                    <div class="loc-sunset">${mins > 0 ? Math.round(mins) + ' MIN TO SUNSET' : 'SUNSET NOW'}</div>
                </div>
            `;
            card.addEventListener('click', () => playCamera(cam));
            locationsGrid.appendChild(card);
        });
    }

    // ─── Main: load cameras ───────────────────────────────────────────────────
    async function loadCameras() {
        // Try fetching live list first (works if same-origin or CORS allowed)
        try {
            const res = await fetch('https://worldwatcher.live/cameras.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                allCameras = data;
                console.log('[SANSET] Loaded live cameras from worldwatcher.live');
                return;
            }
        } catch (e) {
            console.warn('[SANSET] Live fetch failed, using embedded list:', e.message);
        }

        // Fallback: use embedded list
        allCameras = CAMERAS_EMBEDDED;
        console.log('[SANSET] Using embedded camera list');
    }

    function refreshTerminator() {
        if (allCameras.length === 0) return;
        const sunsetCams = selectSunsetCameras(allCameras, 10);
        renderLocations(sunsetCams);

        // Auto-play first camera only on very first load
        if (!currentCamera && sunsetCams.length > 0) {
            playCamera(sunsetCams[0]);
        }

        const top = sunsetCams[0];
        console.log(`[SANSET] Terminator update — ${top?.name} (${Math.round(top?.minsFromSunset)} min to sunset)`);
    }

    async function init() {
        videoContainer.innerHTML = `<div class="loading-feed">ІНІЦІАЛІЗАЦІЯ ПОТОКУ...</div>`;
        await loadCameras();
        refreshTerminator();

        // Re-rank every 10 min as terminator moves
        setInterval(refreshTerminator, 10 * 60 * 1000);
    }

    init();
});
