const express = require('express');
const axios = require('axios');
const mysql = require('mysql2');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = 'bukuEnde@2024';

const app = express();
const port = 3002;

app.use(express.json())
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  });

function connectWithRetry() {
  db.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      console.log('Retrying in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log('Connected to MySQL database');
    }
  });
}

connectWithRetry();

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.post('/api/be/userRegister', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: false, message: 'Username dan password harus diisi.', data: null });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'CALL spBE_UserRegister(?, ?)';
    db.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error saat registrasi:', err);
        return res.status(500).json({ status: false, message: 'Gagal melakukan registrasi.', data: null });
      }

      if (result[0][0].message === 'Success') {
        res.status(201).json({ status: true, message: 'Registrasi berhasil.', data: null });
      } else if (result[0][0].message === 'Already Username') {
        res.status(409).json({ status: false, message: 'Username sudah terdaftar.', data: null });
      } else {
        res.status(500).json({ status: false, message: 'Respons tidak dikenali dari prosedur.', data: null });
      }
    });
  } catch (error) {
    console.error('Error saat hashing password:', error);
    res.status(500).json({ status: false, message: 'Gagal melakukan registrasi.', data: null });
  }
});

app.post('/api/be/userLogin', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: false, message: 'Username dan password harus diisi.', data: null });
  }

  const query = 'CALL spBE_UserLogin(?, ?)';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error saat login:', err);
      return res.status(500).json({ status: false, message: 'Gagal melakukan login.', data: null });
    }

    if (results[0][0].message === 'Success') {
      const token = jwt.sign({ username: username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ status: true, message: 'Login berhasil.', data: { token } });
    } else if (results[0][0].message === 'Failed') {
      res.status(401).json({ status: false, message: 'Username atau password salah.', data: null });
    } else {
      res.status(500).json({ status: false, message: 'Respons tidak dikenali dari prosedur.', data: null });
    }
  });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({
      status: false,
      message: "Authentication token is missing",
      data: null
    });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          status: false,
          message: "Your token has expired",
          data: null
        });
      } else {
        return res.status(403).json({
          status: false,
          message: "Your token is invalid",
          data: null
        });
      }
    }
    req.user = user;
    next();
  });
};

app.get('/api/be/listAllBukuEnde', authenticateToken, (req, res) => {
  const query = 'CALL spBE_GetAllSongTitle()';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        status: false,
        message: 'Not Ok',
        data: null
      });
    }

    const songs = results[0].map(song => ({
      songNumber: song.song_number,
      songTitle: song.song_title
    }));

    res.json({
      status: true,
      message: 'Ok',
      data: songs
    });
  });
});

app.get('/api/be/lyrics', authenticateToken, (req, res) => {
  const { songNumber, songTitle } = req.query;

  if (!songNumber && !songTitle) {
    return res.status(400).json({
      status: false,
      message: 'songNumber or songTitle must be provided',
      data: null
    });
  }

  const query = 'CALL spBE_GetSongLyrics(?, ?)';
  db.query(query, [songNumber || null, songTitle || null], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        status: false,
        message: 'Not Ok',
        data: null
      });
    }

    if (results[0].length === 0) {
      return res.status(404).json({
        status: false,
        message: 'Song not found',
        data: null
      });
    }

    const songData = results[0][0];
    const songLyrics = {};

    const extractVerses = (lyrics) => {
      const verses = lyrics.split(/\d+\.\s/).filter(verse => verse.trim() !== '');
      verses.forEach((verse, index) => {
        songLyrics[`verse${index + 1}`] = verse.trim();
      });
    };

    extractVerses(songData.song_lyric);

    const responseData = {
      songNumber: songData.song_number,
      songTitle: songData.song_title,
      songLyrics: songLyrics
    };

    res.json({
      status: true,
      message: 'Ok',
      data: responseData
    });
  });
});

app.post('/api/be/insertSongTitle', authenticateToken, async (req, res) => {
  const { nomor } = req.query;

  if (!nomor) {
    return res.status(400).json({ status: false, message: 'Nomor lagu tidak diberikan.', data: null });
  }

  try {
    const url = `https://www.ende.sibirong.com/index?nomor=${nomor}`;
    const response = await axios.get(url);

    console.log("LOG: ", response);
    const metaTitleMatch = response.data.match(/<meta name="title" content="([^"]*)">/);
    let fullTitle = metaTitleMatch ? metaTitleMatch[1] : null;

    if (!fullTitle || fullTitle.trim() === '') {
      return res.status(404).json({ status: false, message: `Lagu Nomor ${nomor} tidak ditemukan.`, data: null });
    }
    
    // Ekstrak judul lagu setelah tanda penghubung (-)
    let songTitle = fullTitle.split('-').pop().trim();
    
    if (!songTitle) {
      return res.status(404).json({ status: false, message: `Judul lagu untuk Nomor ${nomor} tidak valid.`, data: null });
    }

    songTitle = songTitle.replace(/\\n|\\r|\\t/g, '').trim();
    console.log("Song Title: ", songTitle);

    const insertQuery = 'CALL spBE_InjectTitleBE(?, ?)';
    db.query(insertQuery, [nomor, songTitle], (err, result) => {
      if (err) {
        console.error('Error saat memasukkan data:', err);
        return res.status(500).json({ status: false, message: 'Gagal memasukkan judul lagu ke database.', data: null });
      }

      if (result[0][0] && result[0][0].isSongNumber === 'True') {
        return res.status(200).json({ status: true, message: `Lagu Nomor ${nomor} sudah ada dalam tabel.`, data: null });
      } else if (result[0][0] && result[0][0].isSongNumber === 'Success') {
        return res.status(200).json({ status: true, message: `Judul lagu berhasil dimasukkan dengan nomor: ${nomor}`, data: null });
      } else {
        return res.status(500).json({ status: false, message: 'Respons tidak dikenali dari prosedur.', data: null });
      }
    });

  } catch (error) {
    console.error('Error saat mengambil judul lagu:', error);
    res.status(500).json({ status: false, message: 'Gagal mengambil judul lagu.', data: null });
  }
});

app.post('/api/be/insertSongLyrics', authenticateToken, async (req, res) => {
  const { nomor } = req.query;

  if (!nomor) {
    return res.status(400).json({ status: false, message: 'Nomor lagu tidak diberikan.', data: null });
  }

  try {
    const url = `https://www.ende.sibirong.com/index?nomor=${nomor}`;
    const response = await axios.get(url);

    console.log("LOG: ", response);
    const metaDescriptionMatch = response.data.match(/<meta name="description" content="([^"]*)">/);
    let songLyrics = metaDescriptionMatch ? metaDescriptionMatch[1] : null;

    if (!songLyrics || songLyrics.trim() === '') {
      return res.status(404).json({ status: false, message: `Lagu Nomor  ${nomor} tidak ditemukan.`, data: null });
    }

    songLyrics = songLyrics.replace(/\\n|\\r|\\t/g, '').trim();
    console.log("Song Lyrics: ", songLyrics);

    const insertQuery = 'CALL spBE_InjectLyricBE(?, ?)';
    db.query(insertQuery, [nomor, songLyrics], (err, result) => {
      if (err) {
        console.error('Error saat memasukkan data:', err);
        return res.status(500).json({ status: false, message: 'Gagal memasukkan lirik lagu ke database.', data: null });
      }

      if (result[0][0] && result[0][0].isSongNumber === 'True') {
        return res.status(200).json({ status: true, message: `Lagu Nomor ${nomor} sudah ada dalam tabel.`, data: null });
      } else if (result[0][0] && result[0][0].isSongNumber === 'Success') {
        return res.status(200).json({ status: true, message: `Lirik lagu berhasil dimasukkan dengan nomor: ${nomor}`, data: null });
      } else {
        return res.status(500).json({ status: false, message: 'Respons tidak dikenali dari prosedur.', data: null });
      }
    });

  } catch (error) {
    console.error('Error saat mengambil lirik lagu:', error);
    res.status(500).json({ status: false, message: 'Gagal mengambil lirik lagu.', data: null });
  }
});

app.get('/api/be/hitAPI/insertSongTitle', authenticateToken, async (req, res) => {
  const { start, end } = req.query;
  
  const startNum = parseInt(start);
  const endNum = parseInt(end);
  
  if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
    return res.status(400).json({ status: false, message: 'Parameter start dan end harus berupa angka, dan start harus lebih kecil atau sama dengan end.', data: null });
  }

  const results = [];
  const errors = [];

  for (let i = startNum; i <= endNum; i++) {
    try {
      const url = `http://localhost:${port}/api/be/insertSongTitle?nomor=${i}`;
      
      const response = await axios.post(url);
      
      results.push({ nomor: i, status: response.data.status, message: response.data.message });
    } catch (error) {
      console.error(`Error saat memproses nomor ${i}:`, error.message);
      errors.push({ nomor: i, error: error.message });
    }
  }

  const responseData = {
    status: true,
    message: `Proses selesai. ${results.length} request berhasil, ${errors.length} request gagal.`,
    data: {
      results: results,
      errors: errors
    }
  };

  res.json(responseData);
});

app.get('/api/be/hitAPI/insertSongLyric', authenticateToken, async (req, res) => {
  const { start, end } = req.query;
  
  const startNum = parseInt(start);
  const endNum = parseInt(end);
  
  if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
    return res.status(400).json({ status: false, message: 'Parameter start dan end harus berupa angka, dan start harus lebih kecil atau sama dengan end.', data: null });
  }

  const results = [];
  const errors = [];

  for (let i = startNum; i <= endNum; i++) {
    try {
      const url = `http://localhost:${port}/api/be/insertSongLyrics?nomor=${i}`;
      
      const response = await axios.post(url);
      
      results.push({ nomor: i, status: response.data.status, message: response.data.message });
    } catch (error) {
      console.error(`Error saat memproses nomor ${i}:`, error.message);
      errors.push({ nomor: i, error: error.message });
    }
  }

  const responseData = {
    status: true,
    message: `Proses selesai. ${results.length} request berhasil, ${errors.length} request gagal.`,
    data: {
      results: results,
      errors: errors
    }
  };

  res.json(responseData);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`API Buku Ende listening at http://localhost:${port}`);
  });
