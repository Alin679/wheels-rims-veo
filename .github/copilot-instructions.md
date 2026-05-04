# Car Sales Website - Project Instructions

## Descriere
Site de vânzări de mașini cu autentificare, panou de administrare și sistem de filtrare.

**Stack:** React (Frontend) + Node.js Express (Backend) + MongoDB (Database)

## Structură Proiect
- `/client` - Aplicație React cu Vite
- `/server` - Backend Express.js
- `/docs` - Documentație

## Comenzi Importante
```bash
# Instalare dependențe (din root)
npm run install-all

# Pornire dev servers (ambele simultan)
npm run dev

# Build pentru producție
npm run build

# Backend doar
cd server && npm run dev

# Frontend doar
cd client && npm run dev
```

## Etapele Completate
- ✅ Structura proiectului
- ✅ Backend API setup (Express.js)
- ✅ Frontend React setup (Vite)
- ⏳ Autentificare JWT
- ⏳ Panou Admin
- ⏳ Modele MongoDB
- ⏳ API endpoints

## Notă PowerShell
Pentru a rula comenzi npm pe Windows, folosiți:
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run install-all"
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

Sau folosiți cmd.exe direct:
```cmd
cmd /c npm run dev
```

