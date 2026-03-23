# 🎟️ FairTix - Solana Event Ticketing System

**FairTix** es una plataforma descentralizada construida sobre la blockchain de **Solana** que permite la creación y gestión de eventos mediante tickets digitales seguros y transparentes. Utiliza el poder de los Smart Contracts (programas on-chain) para garantizar que cada entrada sea única y verificable.

![FairTix Banner](https://img.shields.io/badge/Solana-Hackathon-blueviolet?style=for-the-badge&logo=solana)
![Anchor Framework](https://img.shields.io/badge/Framework-Anchor-black?style=for-the-badge)

---

## 🔥 Características Principales
- **Creación de Eventos On-chain:** Los organizadores pueden registrar eventos directamente en la blockchain de Solana.
- **Tickets Seguros:** Cada ticket está vinculado a una transacción verificable, evitando la duplicidad y el fraude.
- **Integración con Phantom/Solflare:** Conexión fluida con las wallets líderes del ecosistema.
- **Arquitectura Escalable:** Desarrollado con el framework **Anchor** para máxima seguridad y eficiencia.

---

## 🛠️ Stack Tecnológico
- **Blockchain:** Solana (Devnet)
- **Smart Contracts:** Rust & Anchor Framework (En `template_codespaces/anchor`)
- **Frontend:** React + TypeScript + Vite (En `template_codespaces/src`)
- **Estilos:** TailwindCSS / CSS Modules
- **Herramientas:** Solana CLI, Codama (IDL generation)

---

## 🚀 Guía de Inicio Rápido

Si estás usando el entorno de **Codespaces**, sigue estos pasos para desplegar y probar la aplicación:

### 1. Preparar el entorno
Asegúrate de tener activa la ruta de Solana en tu terminal:
```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### 2. Instalación de dependencias
Entra en la carpeta del proyecto e instala los módulos necesarios:
```bash
cd template_codespaces
npm install
```

### 3. Compilación y Despliegue (Blockchain)
Para compilar el programa de Solana y subirlo a la **Devnet**:
```bash
cd anchor
anchor build
anchor deploy
```

### 4. Ejecución del Frontend
Levanta el servidor local para interactuar con la app (regresa a `template_codespaces` si estabas en `anchor`):
```bash
# Si estas en anchor: cd ..
npm run dev
```
La aplicación estará disponible en: `http://localhost:5173`

---

## 📂 Estructura del Proyecto
- `template_codespaces/anchor`: Contiene el código fuente en **Rust** de los programas on-chain.
- `template_codespaces/src`: Contiene el **Frontend** (React, Hooks de conexión, UI).
- `template_codespaces/src/generated`: Archivos IDL generados automáticamente para la comunicación con la blockchain.

---

## 👤 Autor
- **Pedro** (@20pedro01) - *FullStack Developer*

---

> [!TIP]
> Este proyecto fue desarrollado durante el **Solana Hackathon con WayLearn**. Basado en la plantilla oficial para desarrolladores de Solana.
