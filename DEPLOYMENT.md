# Samālōcane Deployment Guide

This guide explains how to deploy the Samālōcane Telemedicine platform to production on **Vercel** (recommended), as well as Docker / Cloud Run.

---

## Option 1: Deploy to Vercel via GitHub (Recommended & Easiest)

Vercel provides native zero-configuration hosting for Next.js with automatic SSL, continuous deployment, and global edge CDN.

### Step 1: Push code to your GitHub account
1. Create a new repository on [GitHub](https://github.com/new) named `samalocane`.
2. In your terminal, link and push this project:
   ```bash
   git remote add origin https://github.com/<your-username>/samalocane.git
   git push -u origin main
   ```

### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and click **Import** next to `samalocane`.
3. Keep the default settings (Framework preset: **Next.js**).
4. Add the following Environment Variables (under **Environment Variables**):
   - `JWT_SECRET`: `samalocane_production_jwt_secret_token_key_32chars`
   - `NEXT_PUBLIC_APP_NAME`: `Samālōcane`
   - `NEXT_PUBLIC_APP_TAGLINE`: `Lightweight Telemedicine for Low-Bandwidth Coastal & Hill Talukas`
   - `DATABASE_URL`: *(Optional)* Leave blank to use the built-in demo mock store, or enter your PostgreSQL connection string.
5. Click **Deploy**.

Your live URL will be ready in approximately 1 minute (e.g., `https://samalocane.vercel.app`).

---

## Option 2: Deploy to Vercel via CLI

If you prefer to deploy directly from your local terminal:

1. Install the Vercel CLI (or run with `npx`):
   ```bash
   npm install -g vercel
   ```
2. Log into your Vercel account:
   ```bash
   vercel login
   ```
3. Deploy to production:
   ```bash
   vercel --prod
   ```
4. Follow the interactive prompts (Accept defaults: project name `samalocane`, root directory `./`).

---

## Option 3: Docker / Container Deployment

A production-ready multi-stage `Dockerfile` is included in this repository.

1. Build the Docker image:
   ```bash
   docker build -t samalocane:latest .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 -e NODE_ENV=production samalocane:latest
   ```
3. Access at `http://localhost:3000`.

---

## Health & Verification
Once deployed, verify your deployment:
- Main Portal: `https://<your-app>.vercel.app/`
- Patient Directory: `https://<your-app>.vercel.app/patient`
- Doctor Directory: `https://<your-app>.vercel.app/doctor`
- Health Endpoint: `https://<your-app>.vercel.app/api/health`

