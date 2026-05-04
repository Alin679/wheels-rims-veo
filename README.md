# 🚗 VeoCars - Platform de Vânzări de Mașini

O platformă web modernă pentru vânzări de mașini cu autentificare utilizatori și panou de administrare.

## 🚀 Caracteristici

- ✅ Frontend React (cu Vite)
- ✅ Backend Node.js/Express
- ✅ Bază de date MongoDB
- ⏳ Autentificare JWT
- ⏳ Panou de administrare
- ⏳ Sistem de filtrare mașini
- ⏳ Dashboard utilizator

## 📋 Cerințe

- Node.js 18+
- MongoDB (local sau cloud)
- npm 9+

## 🔧 Instalare

### 1. Clonare și Setup Inițial
```bash
# Instalare dependențe
npm run install-all
```

### 2. Configurare Environment
```bash
# Backend
cp server/.env.example server/.env

# Editați server/.env și setați valorile pentru:
# - MONGODB_URI
# - JWT_SECRET
```

### 3. Pornire Development

```bash
# Pornire simultană (frontend + backend)
npm run dev

# Sau separat:
# Frontend pe http://localhost:3000
cd client && npm run dev

# Backend pe http://localhost:5000
cd server && npm run dev
```

## 📁 Structură Proiect

```
.
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/              # Backend Express
│   ├── src/
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── package.json         # Root scripts
└── README.md
```

## 🛠️ Comenzi Disponibile

```bash
# Instalare dependențe globale
npm run install-all

# Pornire ambelor servere
npm run dev

# Build pentru producție
npm run build

# Start server producție
npm start
```

## 🔐 Autentificare

Sistemul va folosi JWT tokens. Detalii vor fi adăugate în versiunea următoare.

## 📝 Licență

MIT

---

**Status:** 🚧 În dezvoltare activă
