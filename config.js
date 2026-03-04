// Evolution RP - Global Website Configuration
const WebsiteConfig = {
    serverName: "Evolution RP",
    tagline: "En ny standard for dansk roleplay.",
    serverIp: "DIN_SERVER_IP", 
    txAdminPort: "40120",       
    refreshInterval: 5000,      
    discordInvite: "https://discord.gg/FSSGVYsrhP", 
    
    // SUPABASE CONFIGURATION
    supabaseUrl: "https://hrtevidkppyybdcmyjiy.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydGV2aWRrcHB5eWJkY215aml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDAxMTksImV4cCI6MjA4ODIxNjExOX0.WRsaddoMlQomY0Ks62kE20HSGKblopv6O09-OlTNvpU",

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

// --- Supabase Initialization ---
let supabaseClient;
try {
    const lib = window.supabasejs || window.supabase;
    if (lib && lib.createClient) {
        supabaseClient = lib.createClient(WebsiteConfig.supabaseUrl, WebsiteConfig.supabaseAnonKey);
        console.log("Supabase Client klar!");
        
        // Lytter efter ændringer i loginstatus (VIGTIGT for at opdatere UI efter login)
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);
            if (session) {
                checkUserSession();
            } else {
                localStorage.removeItem('evo_user_data');
                // updateHeaderUI(null) kunne tilføjes her hvis nødvendigt
            }
        });
    } else {
        console.error("Supabase SDK ikke fundet! Tjek dine script-tags i HTML.");
    }
} catch (e) {
    console.error("Fejl ved initialisering af Supabase:", e);
}

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

// --- Discord Login System med Supabase ---
async function loginWithDiscord() {
    console.log("Forsøger login med Discord...");
    if (!supabaseClient) {
        alert("Supabase er ikke klar endnu. Prøv at genindlæse siden.");
        return;
    }
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'discord',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });

        if (error) {
            console.error("Login fejl:", error.message);
            alert("Login fejl: " + error.message);
        } else if (data && data.url) {
            console.log("Login URL modtaget, omdirigerer nu til:", data.url);
            
            // Vi prøver 3 forskellige metoder til at tvinge omdirigering
            try {
                window.location.assign(data.url);
                
                // Hvis den ikke er væk efter 300ms, prøv href
                setTimeout(() => {
                    if (window.location.href !== data.url) {
                        window.location.href = data.url;
                    }
                }, 300);

                // Sidste udvej: Åbn i ny fane hvis alt andet fejler efter 1 sekund
                setTimeout(() => {
                    if (window.location.href !== data.url) {
                        console.warn("Standard omdirigering fejlede, prøver window.open...");
                        window.open(data.url, '_blank');
                    }
                }, 1000);
            } catch (err) {
                console.error("Fejl ved omdirigering:", err);
                window.open(data.url, '_blank');
            }
        }
    } catch (e) {
        console.error("Kritisk login fejl:", e);
    }
}

async function handleLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    localStorage.removeItem('evo_user_data');
    location.reload();
}

async function checkUserSession() {
    if (!supabaseClient) return;

    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (session && session.user) {
        console.log("Bruger session fundet for:", session.user.email);
        const meta = session.user.user_metadata;
        const userData = {
            id: meta.provider_id || session.user.id,
            name: meta.full_name || meta.name || meta.display_name || meta.custom_claims?.global_name || session.user.email.split('@')[0],
            avatar: meta.avatar_url || meta.picture || `https://ui-avatars.com/api/?name=${session.user.email}`
        };
        localStorage.setItem('evo_user_data', JSON.stringify(userData));
        updateHeaderUI(userData);
    } else {
        localStorage.removeItem('evo_user_data');
    }
}

function updateHeaderUI(userData) {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // Find knappen mere robust (kigger efter indhold uanset ikoner)
    const loginBtn = Array.from(headerActions.querySelectorAll('a, button')).find(el => {
        const text = el.innerText.toUpperCase();
        return text.includes("LOG IND") || text.includes("LOGIN") || el.classList.contains('btn-login');
    });

    if (loginBtn) {
        console.log("Opdaterer UI for:", userData.name);
        loginBtn.style.display = 'none';
        
        // Fjern gammel badge hvis den findes (for at undgå dubletter)
        const oldBadge = headerActions.querySelector('.user-badge');
        if (oldBadge) oldBadge.remove();

        const badge = document.createElement('div');
        badge.className = "user-badge";
        badge.style.cssText = "display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); padding:6px 14px; border-radius:100px; border:1px solid var(--border); cursor:pointer; pointer-events:auto; z-index:2000000;";
        badge.innerHTML = `
            <img src="${userData.avatar}" style="width:28px; height:28px; border-radius:50%; border:2px solid var(--primary);">
            <span style="font-weight:600; font-size:13px; color:white;">${userData.name}</span>
            <i class="fas fa-sign-out-alt" style="font-size:12px; color:#ef4444; margin-left:5px;" onclick="handleLogout()"></i>
        `;
        headerActions.appendChild(badge);
    }
}

function initLoginSystem() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('a, button');
        if (btn) {
            const text = btn.innerText.trim().toUpperCase();
            console.log("KLIK registreret på element med tekst:", text);
            
            if (text.includes("LOG IND") || text.includes("LOGIN")) {
                console.log("Login-knap genkendt! Starter login-proces...");
                e.preventDefault();
                e.stopPropagation();
                loginWithDiscord();
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
        } catch (e) {
            // Vi logger ikke fejlen for at undgå at fylde konsollen
        }
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

async function applyGlobalConfig() {
    console.log("Initialiserer Evolution RP system...");
    try {
        initLoginSystem();

        // Hurtig UI opdatering fra cache (så profil ikke forsvinder ved sideskift)
        const storedUser = localStorage.getItem('evo_user_data');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                updateHeaderUI(userData);
            } catch (e) { localStorage.removeItem('evo_user_data'); }
        }

        // Bekræft session med Supabase i baggrunden
        await checkUserSession();

        document.title = WebsiteConfig.serverName;
        document.querySelectorAll('.logo').forEach(el => {
            el.innerHTML = `<img src="logo.png" style="height:45px; filter:drop-shadow(0 5px 15px rgba(59,130,246,0.6));"> EVOLUTION<span style="color:var(--primary); margin-left:4px;">RP</span>`;
        });

        initSharedSlideshow();
        initScrollReveal();
        updateServerStats();
        setInterval(updateServerStats, WebsiteConfig.refreshInterval);

        document.querySelectorAll('a').forEach(a => {
            if (a.innerText.toUpperCase().includes("DISCORD")) a.href = WebsiteConfig.discordInvite;
            if (a.innerText.toUpperCase() === "SPIL NU") a.href = `fivem://connect/${WebsiteConfig.serverIp}`;
        });
        console.log("System klar!");

    } catch (e) { console.error("Kritisk fejl under opstart:", e); }
}

window.addEventListener('DOMContentLoaded', applyGlobalConfig);