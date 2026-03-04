// Evolution RP - Global Website Configuration
const WebsiteConfig = {
    serverName: "Evolution RP",
    tagline: "En ny standard for dansk roleplay.",
    serverIp: "DIN_SERVER_IP", 
    txAdminPort: "40120",       
    refreshInterval: 5000,      
    discordInvite: "https://discord.gg/FSSGVYsrhP", 
    
    // DISCORD LOGIN SETUP
    discordClientId: "DIT_CLIENT_ID", 
    redirectUri: window.location.href.split('#')[0].split('?')[0],

    // DISCORD WEBHOOKS
    webhooks: {
        applications: "DIN_ANSØGNING_WEBHOOK", // Her lander nye ansøgninger
        answers: "DIT_SVAR_WEBHOOK"            // Her lander svar (godkendt/afvist)
    },

    // STYR ANSØGNINGER HER (open / closed)
    applications: { 
        police: "open", 
        ems: "open", 
        staff: "open",
        whitelist: "closed",
        company: "open",
        ck: "open",
        pk: "open",
        unban: "open"
    },
    donationLink: "DIT_TEBEX_LINK"
};

// --- CSS Fix (Tvinger menuen til at virke) ---
const styleFix = document.createElement('style');
styleFix.innerHTML = `
    header { z-index: 999999 !important; pointer-events: auto !important; position: fixed !important; }
    .header-actions, .header-actions a, .btn-primary { 
        z-index: 1000000 !important; 
        pointer-events: auto !important; 
        cursor: pointer !important; 
        position: relative !important; 
    }
`;
document.head.appendChild(styleFix);

// --- Discord Login System ---
async function handleDiscordLogin() {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');

    if (accessToken) {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userData = await response.json();
            
            if (userData.id) {
                const userObj = {
                    id: String(userData.id), // Sikrer at det er en tekststreng
                    name: userData.global_name || userData.username,
                    avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : `https://ui-avatars.com/api/?name=${userData.username}`
                };
                localStorage.setItem('evo_user_data', JSON.stringify(userObj));
                window.location.hash = "";
                location.reload();
            } else {
                alert("Kunne ikke hente din Discord ID. Prøv igen.");
            }
        } catch (e) { console.error("Login fejl:", e); }
    }
}

function initLoginSystem() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('a, button');
        if (btn) {
            const text = btn.innerText.toUpperCase();
            if (text.includes("LOG IND") || text.includes("LOGIN")) {
                e.preventDefault();
                e.stopPropagation();

                if (window.location.protocol === 'file:') {
                    alert("STOP! Du skal køre siden gennem Live Server (højreklik på index.html -> Open with Live Server), ellers blokerer Discord for dit login!");
                    return;
                }

                const scope = encodeURIComponent('identify');
                const redirect = encodeURIComponent(WebsiteConfig.redirectUri);
                const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${WebsiteConfig.discordClientId}&redirect_uri=${redirect}&response_type=token&scope=${scope}`;
                
                window.location.href = authUrl;
            }
        }
    }, true);
}

// --- Live Stats System ---
async function updateServerStats() {
    const playersEl = document.getElementById('online-players');
    if (!playersEl) return;

    const endpoints = [
        `http://localhost:30120/dynamic.json`,
        `http://127.0.0.1:30120/dynamic.json`,
        `http://localhost:${WebsiteConfig.txAdminPort}/stats.json`
    ];

    for (let url of endpoints) {
        try {
            const res = await fetch(url, { 
                mode: 'cors',
                cache: 'no-cache'
            });
            
            if (res.ok) {
                const data = await res.json();
                let count = data.clients !== undefined ? data.clients : (data.players !== undefined ? data.players : 0);
                playersEl.innerText = `${count}/64`;
                return;
            }
        } catch (e) {}
    }

    if (playersEl.innerText === "Henter..." || playersEl.innerText === "OFFLINE") {
        playersEl.innerText = "1/64";
    }
}

// --- Standard Animationer ---
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
}

function initSharedSlideshow() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        slides[0].classList.add('active');
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, 5000);
    }
}

function applyGlobalConfig() {
    try {
        initLoginSystem();
        handleDiscordLogin();

        document.title = WebsiteConfig.serverName;
        document.querySelectorAll('.logo').forEach(el => {
            el.innerHTML = `<img src="logo.png" style="height:45px; filter:drop-shadow(0 5px 15px rgba(59,130,246,0.6));"> EVOLUTION<span style="color:var(--primary); margin-left:4px;">RP</span>`;
        });

        initSharedSlideshow();
        initScrollReveal();
        updateServerStats();
        setInterval(updateServerStats, WebsiteConfig.refreshInterval);

        const storedUser = localStorage.getItem('evo_user_data');
        const headerActions = document.querySelector('.header-actions');
        
        if (storedUser && headerActions) {
            const userData = JSON.parse(storedUser);
            
            // Hvis sessionen er gammel og mangler ID, så log ud automatisk
            if (!userData.id) {
                localStorage.removeItem('evo_user_data');
                location.reload();
                return;
            }

            const loginBtn = Array.from(headerActions.querySelectorAll('a')).find(a => a.innerText.trim().toUpperCase() === "LOG IND" || a.innerText.trim().toUpperCase() === "LOGIND");
            
            if (loginBtn) {
                loginBtn.style.display = 'none';
                const badge = document.createElement('div');
                badge.style.cssText = "display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:6px 14px; border-radius:100px; border:1px solid var(--border); cursor:pointer; pointer-events:auto; z-index:2000000;";
                badge.innerHTML = `
                    <img src="${userData.avatar}" style="width:28px; height:28px; border-radius:50%; border:2px solid var(--primary);">
                    <span style="font-weight:600; font-size:13px; color:white;">${userData.name}</span>
                    <i class="fas fa-sign-out-alt" style="font-size:12px; color:#ef4444; margin-left:5px;" onclick="localStorage.removeItem('evo_user_data'); location.reload();"></i>
                `;
                headerActions.appendChild(badge);
            }
        }

        document.querySelectorAll('a').forEach(a => {
            if (a.innerText.toUpperCase().includes("DISCORD")) a.href = WebsiteConfig.discordInvite;
            if (a.innerText.toUpperCase() === "SPIL NU") a.href = `fivem://connect/${WebsiteConfig.serverIp}`;
        });

    } catch (e) { console.error("Config error", e); }
}

window.addEventListener('DOMContentLoaded', applyGlobalConfig);