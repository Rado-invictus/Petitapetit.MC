import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("club_moto.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bike TEXT NOT NULL,
    img TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS agenda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    desc TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS past_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    img TEXT NOT NULL
  );
`);

// Seed data if empty
const memberCount = db.prepare("SELECT COUNT(*) as count FROM members").get() as { count: number };
if (memberCount.count === 0) {
  const insertMember = db.prepare("INSERT INTO members (name, role, bike, img) VALUES (?, ?, ?, ?)");
  insertMember.run('Andry "Le Chef"', 'Président', 'Harley Davidson Fat Boy', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop');
  insertMember.run('Mamy', 'Vice-Président', 'BMW R1250GS', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop');
  insertMember.run('Rivo', 'Trésorier', 'Kawasaki Z1000', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop');
}

const agendaCount = db.prepare("SELECT COUNT(*) as count FROM agenda").get() as { count: number };
if (agendaCount.count === 0) {
  const insertAgenda = db.prepare("INSERT INTO agenda (title, date, time, type, desc) VALUES (?, ?, ?, ?, ?)");
  insertAgenda.run('Ride vers Mantasoa', '15 Mars 2024', '08:00', 'Sortie Détente', 'Une balade tranquille vers le lac de Mantasoa avec déjeuner au bord de l\'eau.');
  insertAgenda.run('Rassemblement Mensuel', '28 Mars 2024', '18:30', 'Réunion', 'Point sur les activités du club et accueil des nouveaux membres à Ankorondrano.');
}

const pastCount = db.prepare("SELECT COUNT(*) as count FROM past_events").get() as { count: number };
if (pastCount.count === 0) {
  const insertPast = db.prepare("INSERT INTO past_events (title, date, img) VALUES (?, ?, ?)");
  insertPast.run('Tana Moto Show 2023', 'Novembre 2023', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2070&auto=format&fit=crop');
  insertPast.run('Ride Solidaire Noël', 'Décembre 2023', 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?q=80&w=2070&auto=format&fit=crop');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/members", (req, res) => {
    const members = db.prepare("SELECT * FROM members").all();
    res.json(members);
  });

  app.post("/api/members", (req, res) => {
    const { name, role, bike, img } = req.body;
    const result = db.prepare("INSERT INTO members (name, role, bike, img) VALUES (?, ?, ?, ?)").run(name, role, bike, img);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/members/:id", (req, res) => {
    db.prepare("DELETE FROM members WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/agenda", (req, res) => {
    const agenda = db.prepare("SELECT * FROM agenda").all();
    res.json(agenda);
  });

  app.post("/api/agenda", (req, res) => {
    const { title, date, time, type, desc } = req.body;
    const result = db.prepare("INSERT INTO agenda (title, date, time, type, desc) VALUES (?, ?, ?, ?, ?)").run(title, date, time, type, desc);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/agenda/:id", (req, res) => {
    db.prepare("DELETE FROM agenda WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/past-events", (req, res) => {
    const events = db.prepare("SELECT * FROM past_events").all();
    res.json(events);
  });

  app.post("/api/past-events", (req, res) => {
    const { title, date, img } = req.body;
    const result = db.prepare("INSERT INTO past_events (title, date, img) VALUES (?, ?, ?)").run(title, date, img);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/past-events/:id", (req, res) => {
    db.prepare("DELETE FROM past_events WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Simple Admin Auth (for demo purposes)
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === "tanamoto2024") {
      res.json({ success: true, token: "admin-token-123" });
    } else {
      res.status(401).json({ success: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
