import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt"; // bcrypt ekledik

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, "uploads");
const postsFile = path.join(__dirname, "posts.json");
const usersFile = path.join(__dirname, "users.json"); // Kullanıcılar için yeni dosya

app.use("/uploads", express.static(uploadDir));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Kullanıcıları yükleme ve kaydetme
let users = [];
const loadUsers = async () => {
  try {
    const data = await fsPromises.readFile(usersFile, "utf8");
    users = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fsPromises.writeFile(usersFile, JSON.stringify([]));
      users = [];
    } else {
      console.error("Kullanıcılar yüklenemedi:", error);
    }
  }
};

const saveUsers = async () => {
  try {
    await fsPromises.writeFile(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Kullanıcılar kaydedilemedi:", error);
  }
};

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Geçersiz dosya türü! Yalnızca resim, video veya ses dosyaları."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
});

// Posts ve Users yükleme
let posts = [];
const loadPosts = async () => {
  try {
    const data = await fsPromises.readFile(postsFile, "utf8");
    posts = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fsPromises.writeFile(postsFile, JSON.stringify([]));
      posts = [];
    } else {
      console.error("Posts yüklenemedi:", error);
    }
  }
};

const savePosts = async () => {
  try {
    await fsPromises.writeFile(postsFile, JSON.stringify(posts, null, 2));
  } catch (error) {
    console.error("Posts kaydedilemedi:", error);
  }
};

loadPosts();
loadUsers(); // Kullanıcıları da yükle

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kayıt endpoint’i
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Tüm alanlar zorunludur." });
  }

  if (users.some((user) => user.email === email)) {
    return res.status(400).json({ error: "Bu e-posta zaten kayıtlı." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    username,
    email,
    password: hashedPassword,
  };

  users.push(newUser);
  await saveUsers();

  res.status(201).json({ message: "Kayıt başarılı!" });
});

// Mevcut endpoint’ler
app.get("/", (req, res) => {
  res.json({
    message: "Hoş geldiniz! API endpoint’leri: /share (POST), /posts (GET), /posts/:id (DELETE)",
  });
});

app.post("/share", upload.array("files", 5), async (req, res) => {
  const message = req.body.message?.trim();
  const tags = req.body.tags?.trim();
  const files = req.files?.map((file) => file.filename);

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "Lütfen en az bir dosya yükleyin." });
  }
  if (!message) {
    return res.status(400).json({ error: "Lütfen bir mesaj yazın." });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: "Mesaj 1000 karakterden uzun olamaz." });
  }

  const newPost = {
    id: Date.now(),
    message,
    files,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    timestamp: new Date().toISOString(),
  };

  posts.unshift(newPost);
  await savePosts();

  res.status(201).json({ post: newPost });
});

app.get("/posts", (req, res) => {
  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(sortedPosts);
});

app.delete("/posts/:id", async (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex((post) => post.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: "Paylaşım bulunamadı." });
  }

  const [deletedPost] = posts.splice(postIndex, 1);

  // İlişkili dosyaları sil
  for (const filename of deletedPost.files) {
    const filePath = path.join(uploadDir, filename);
    try {
      await fsPromises.unlink(filePath);
    } catch (error) {
      console.error(`Dosya silinemedi: ${filename}`, error);
    }
  }

  await savePosts();
  res.status(200).json({ message: "Paylaşım başarıyla silindi.", post: deletedPost });
});

app.post("/contact", (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Tüm alanlar zorunludur." });
  }

  console.log("İletişim:", { name, email, subject, message });
  res.status(200).json({ message: "Mesajınız alındı!" });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: "Dosya yükleme hatası: " + err.message });
  }
  res.status(500).json({ error: "Sunucu hatası: " + err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: "Bu endpoint bulunamadı." });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});