# 🧱 Eternity Ready Podcast Admin – Keystone.js Source Code

> The application runs by default on port `3000` or on the port entered in .env during development or production.

## 🚧 Setup (Development)

After cloning the repository, follow these steps to run the Keystone CMS locally:

1. **Install Node.js dependencies:**

```bash
npm install
```

2. **Create a `.env` file in the root directory with the following variables:**

```env
DATABASE_URL=mysql://keystone:ZWHb78t[XVu8fJ@u@localhost:3306/keystone
ALLOWED_ORIGINS=https://keystone.eternityready.com,https://podcasts.eternityready.com,http://localhost:3001
PORT=3000 (optional)
NODE_ENV=production
DEBUG=keystone*
REVALIDATION_TOKEN=eternityready
```

> Example:
>
> - `DATABASE_URL`: `mysql://user:password@localhost:3306/dbname`
> - `ALLOWED_ORIGINS`: URLs allowed to make requests (e.g., `https://yourdomain.com,http://localhost:3000`)
> - `PORT`: Port to run the app (default is 3000)
> - `REVALIDATION_TOKEN`: Token for triggering static regeneration from frontend

3. **Run the Keystone app in development mode:**

```bash
npm run dev
```

Keystone Admin UI will be available at: [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploying to Production

1. **Build the application (if required by custom setup):**

```bash
npm run build
```

2. **Start the production server:**

```bash
npm run start
```

> ℹ️ Default port: 3000

The admin panel will be available on the configured port.

---

## 🔁 Keep Application Online (PM2)

To keep the Keystone.js server running in the background using [PM2](https://pm2.keymetrics.io/):

1. **Start the app with PM2:**

```bash
pm2 start npm --name "keystone-admin" -- start
```

2. **Save the process list:**

```bash
pm2 save
```

> This keeps the service running persistently while the server is active.

---

## 🔄 Workflow to Update the Production App

To update the production instance of Keystone:

1. **Pull the latest code and install dependencies (if needed):**

```bash
git pull origin main
npm install
```

2. **Rebuild the app (if applicable):**

```bash
npm run build
```

3. **Reload the PM2 process:**

```bash
pm2 reload keystone-admin
```

> Use `pm2 list` to find the process name or ID.

---

## ✅ Requirements

- Node.js 18+
- MySQL Server running and accessible
- PM2 globally installed (`npm install -g pm2`)
