# Vejledning til Evolution RP Hjemmeside

Denne guide forklarer, hvordan du opsætter og administrerer din nye FiveM hjemmeside. Alt konfiguration foregår i filen `./config.js`.

## 1. Discord Login (OAuth2)
For at spillere kan logge ind og blive tagget i Discord, skal du oprette en App:
1. Gå til [Discord Developer Portal](https://discord.com/developers/applications).
2. Tryk på **"New Application"** og giv den et navn.
3. Gå til fanen **"OAuth2"**.
4. Under **"Redirects"**, tilføj din hjemmesides URL (f.eks. `https://din-side.dk/index.html` eller `http://127.0.0.1:5500/index.html` hvis du tester lokalt).
5. Kopier dit **"Client ID"** og sæt det ind i `config.js` under `discordClientId`.

## 2. Discord Webhooks
Hjemmesiden sender ansøgninger direkte til din Discord-server:
1. Gå til dine serverindstillinger i Discord -> **Integrations** -> **Webhooks**.
2. Opret to webhooks:
   - En til **nye ansøgninger** (sæt linket i `webhooks.applications`).
   - En til **svar til spillere** (sæt linket i `webhooks.answers`).
3. Når du godkender/afviser en ansøgning via `admin.html`, vil botten automatisk tagge spilleren i svar-kanalen.

## 3. Administrer Ansøgninger (Åben/Lukket)
Du kan styre, hvilke ansøgninger der er tilgængelige for spillerne direkte i `config.js`:
- Find sektionen `applications`.
- Skift mellem `"open"` (Åben) og `"closed"` (Lukket).
- Hvis en ansøgning er lukket, vil knappen på hjemmesiden blive grå, og der vil stå "Lukket".

## 4. Live Stats (Spillertæller)
Hjemmesiden henter automatisk antal spillere fra din server:
- Sæt din server-IP i `serverIp`.
- Sæt din txAdmin port (standard er 40120) i `txAdminPort`.
- **Bemærk:** Hvis du tester lokalt, kan din browser blokere stats pga. "CORS". Dette forsvinder, når siden lægges op på en rigtig server-IP.

## 5. Admin Panel (`admin.html`)
For at besvare ansøgninger:
1. Når du modtager en ansøgning i Discord, tryk på knappen **"Åbn Admin Panel"**.
2. Her kan du se spillerens svar, skrive en begrundelse og trykke **"Godkend"** eller **"Afvis"**.
3. Svaret bliver sendt til din svar-kanal i Discord, hvor spilleren bliver tagget.

---
*Udviklet til Evolution RP*