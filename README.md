
# 🚀 Prototype LeADS - Tugas Akhir

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

---

## 📖 About

This is a **Next.js** project integrated with **Firebase Authentication** for frontend, and a **Python Backend** serving a Machine Learning model.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/jefthah/tugas-akhir.git
cd tugas-akhir
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Prepare Required Files

There are files that are **NOT included** in the GitHub repository for security reasons.
You must manually add:

- `/src/lib/firebase.js` → for Firebase initialization.
- `.env.local` → contains API keys and environment configs.
- `/Backend/` → Python backend folder (model files, etc.).

**These files are shared separately via Google Drive.** 🔗

### 4. Running the App

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Then open [http://localhost:3000](http://localhost:3000) on your browser.

---

## 📂 Project Structure

```
/
├── Backend/               # Python backend (excluded)
├── public/                 # Static files
├── src/
│   ├── app/                # Next.js pages/routes
│   ├── components/         # React components
│   └── lib/                # Libraries (firebase.js etc.)
├── .gitignore
├── next.config.mjs
├── package.json
├── README.md
├── tailwind.config.js
└── .env.local (excluded)
```

---

## ⚠️ Important

**Missing files:**
- `.env.local`
- `src/lib/firebase.js`
- `Backend/` folder (ML models)

You must manually download these files from the provided Google Drive.

---


---

## 🛠 Deployment

You can deploy this project easily using:

- [Vercel](https://vercel.com/) (Recommended 🚀)
- Netlify
- Any Node.js supported server

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Python Flask Documentation](https://flask.palletsprojects.com/)

---

## 🧡 License

This project is intended only for **academic and personal** use.  
**NOT** for commercial purposes.

Created with ❤️ by **@jefthah** 🚀
