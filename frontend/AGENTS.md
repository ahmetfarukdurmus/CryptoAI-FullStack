# CryptoAI - Architecture & Development Guidelines

This is a **Bare React Native (CLI)** mobile application built without Expo to ensure minimal dependencies, native performance (60 FPS), and full cross-platform control.

## 1. Core Principles & Philosophy
- **Expo-Free**: Zero Expo runtime dependencies. Native Android/iOS structure with pure React Native components (`StyleSheet`, `Pressable`, `View`, `Text`, `FlatList`).
- **Strict Modularity (100–200 LOC per file)**: Every component, screen, hook, and service must remain strictly within 100 to 200 lines of code. Large screens must be split into dedicated feature components.
- **Feature-Driven Architecture**: Code is organized under `src/features/<feature_name>/` (auth, portfolio, market, autopilot, profile).
- **Backend-Ready (Spring Boot DTO Compatibility)**: Frontend services match the backend REST API DTOs with typed mock adapters in `src/services/api/`.

## 2. Directory Structure
```
src/
├── features/
│   ├── auth/                        # Giriş, Kayıt, Şifre Doğrulama
│   ├── portfolio/                   # Cüzdan, Bakiye, Varlık Listesi, LLM Analiz
│   ├── market/                      # Tüm Piyasa, Takip Listem, Coin Detay & Trading
│   ├── autopilot/                   # AI Otopilot, Model Metrikleri, Alarm & Strateji
│   └── profile/                     # Hesap, Finansal İşlemler, Güvenlik (2FA/FaceID)
├── shared/
│   ├── components/                  # Button, Input, Card, Badge, Toggle, Header
│   └── theme/                       # Colors, Typography, Spacing
├── services/api/                    # REST DTOs, Mock Data, API Service Layer
├── context/                         # AuthContext, AppContext
└── navigation/                      # RootNavigator, AuthNavigator, MainTabNavigator
```

## 3. Design System & Theme Tokens
- **Background**: `#090D14` (Deep Navy / Pure Dark)
- **Card**: `#131922` (Border: `#1F2937`)
- **Primary / Accent**: `#00B2FE` (Cyan Blue)
- **Success / Profit**: `#00E676` (Neon Green)
- **Danger / Loss**: `#FF3B30` (Crimson Red)

## 4. Running the Project
- **Web Preview (Instant Dev Server)**: `npm run dev` or `npm run web` (Opens at http://localhost:3000)
- **Android**: `npm run android`
- **iOS**: `npm run ios`
