const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding...'))
  .catch(err => { console.error(err); process.exit(1); });

const bcrypt = require('bcryptjs');

const userSchema    = new mongoose.Schema({ name: String, email: { type: String, unique: true }, phone: String, password: String, role: { type: String, default: 'user' } }, { timestamps: true });
const movieSchema   = new mongoose.Schema({ title: String, description: String, genre: [String], language: [String], duration: Number, releaseDate: Date, poster: String, banner: String, trailer: String, rating: Number, status: String, format: [String] }, { timestamps: true });
const theatreSchema = new mongoose.Schema({ name: String, location: String, city: String, screens: Number, totalSeats: Number, status: String, amenities: [String] }, { timestamps: true });
const showSchema    = new mongoose.Schema({ movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }, theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' }, date: Date, time: String, format: String, language: String, totalSeats: Number, availableSeats: Number, bookedSeats: [String], price: Number, status: String }, { timestamps: true });
const bookingSchema = new mongoose.Schema({}, { strict: false });

const User    = mongoose.models.User    || mongoose.model('User',    userSchema);
const Movie   = mongoose.models.Movie   || mongoose.model('Movie',   movieSchema);
const Theatre = mongoose.models.Theatre || mongoose.model('Theatre', theatreSchema);
const Show    = mongoose.models.Show    || mongoose.model('Show',    showSchema);
const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

const seed = async () => {
  try {
    // ── USERS: only create if not exists ──────────────────────────────
    const adminExists = await User.findOne({ email: 'jagadeeshakash171@gmail.com' });
    if (!adminExists) {
      const adminPassword = bcrypt.hashSync('Admin@123', 10);
      await User.create({ name: 'Admin', email: 'jagadeeshakash171@gmail.com', phone: '9999999999', password: adminPassword, role: 'admin' });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists — skipped');
    }

    const userExists = await User.findOne({ email: 'testuser.bms@gmail.com' });
    if (!userExists) {
      const userPassword = bcrypt.hashSync('User@123', 10);
      await User.create({ name: 'Test User', email: 'testuser.bms@gmail.com', phone: '9876543210', password: userPassword, role: 'user' });
      console.log('Test user created');
    } else {
      console.log('Test user already exists — skipped');
    }

    // ── MOVIES: only insert movies that don't already exist ───────────
    const moviesData = [
      // ── NOW SHOWING (6 movies) ──────────────────────────────────────
      {
        title: 'Kalki 2898 AD',
        description: 'A modern-day avatar of Vishnu. An epic adaptation of a story from the Hindu epic Mahabharat set in the distant future.',
        genre: ['Action', 'Drama', 'Sci-Fi'],
        language: ['Telugu', 'Hindi', 'Tamil', 'Kannada'],
        duration: 176,
        releaseDate: new Date('2024-05-31'),
        poster: 'https://image.tmdb.org/t/p/w500/nkVGqkBJQDWQyJJFVKLPgFZdXhD.jpg',
        banner: 'https://image.tmdb.org/t/p/original/bY6HaqHDUhU3lbhPTMbR4W0GBOY.jpg',
        trailer: 'https://www.youtube.com/watch?v=P9SZBX-hUzs',
        rating: 8.3, status: 'Now Showing', format: ['2D', 'IMAX 2D', '4DX'],
      },
      {
        title: 'Furiosa: A Mad Max Saga',
        description: 'The story of Furiosa before she joined Max on the Fury Road.',
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: ['English', 'Hindi'],
        duration: 148,
        releaseDate: new Date('2024-05-24'),
        poster: 'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
        banner: 'https://image.tmdb.org/t/p/original/xDMIl84Qo5Tsu62c9DGWhmPI67A.jpg',
        trailer: 'https://www.youtube.com/watch?v=XJMuhwVlca4',
        rating: 8.0, status: 'Now Showing', format: ['2D', 'IMAX 2D', 'MX4D'],
      },
      {
        title: 'Avengers: Endgame',
        description: 'After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos\'s actions.',
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: ['English', 'Hindi', 'Tamil', 'Telugu'],
        duration: 181,
        releaseDate: new Date('2024-04-26'),
        poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
        banner: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
        trailer: 'https://www.youtube.com/watch?v=TcMBFSGVi1c',
        rating: 9.0, status: 'Now Showing', format: ['2D', 'IMAX 2D', '4DX', 'MX4D'],
      },
      {
        title: 'Interstellar',
        description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
        genre: ['Drama', 'Sci-Fi', 'Adventure'],
        language: ['English', 'Hindi', 'Tamil'],
        duration: 169,
        releaseDate: new Date('2024-02-10'),
        poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        banner: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
        trailer: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        rating: 8.6, status: 'Now Showing', format: ['2D', 'IMAX 2D'],
      },
      {
        title: 'Oppenheimer',
        description: 'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during WWII.',
        genre: ['Drama', 'History', 'Thriller'],
        language: ['English', 'Hindi'],
        duration: 180,
        releaseDate: new Date('2024-07-21'),
        poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        banner: 'https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
        trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        rating: 8.4, status: 'Now Showing', format: ['2D', 'IMAX 2D', '4DX'],
      },
      {
        title: 'The Shawshank Redemption',
        description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        genre: ['Drama'],
        language: ['English', 'Hindi'],
        duration: 142,
        releaseDate: new Date('2024-03-15'),
        poster: 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
        banner: 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
        trailer: 'https://www.youtube.com/watch?v=6hB3S9bIaco',
        rating: 9.3, status: 'Now Showing', format: ['2D'],
      },
      // ── UPCOMING (1 movie) ──────────────────────────────────────────
      {
        title: 'Bhairava',
        description: 'An action-packed thriller featuring a cop on a mission to dismantle a powerful crime syndicate.',
        genre: ['Action', 'Thriller'],
        language: ['Tamil', 'Hindi', 'Telugu'],
        duration: 158,
        releaseDate: new Date('2026-06-15'),
        poster: 'https://image.tmdb.org/t/p/w500/A4TGm4A7KKAKMFQ0bLYdJ3c9SDG.jpg',
        banner: 'https://image.tmdb.org/t/p/original/A4TGm4A7KKAKMFQ0bLYdJ3c9SDG.jpg',
        trailer: '',
        rating: 7.9, status: 'Upcoming', format: ['2D', 'IMAX 2D'],
      },
      {
        title: 'Inside Out 2',
        description: 'Joy, Sadness, Anger, Fear and Disgust face a new emotion called Anxiety.',
        genre: ['Animation', 'Comedy', 'Family'],
        language: ['English', 'Hindi', 'Tamil'],
        duration: 100,
        releaseDate: new Date('2026-07-14'),
        poster: 'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
        banner: 'https://image.tmdb.org/t/p/original/xg27NrXi7VXCGUr7MG75UqLl21M.jpg',
        trailer: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
        rating: 8.1, status: 'Upcoming', format: ['2D', '3D'],
      },
      {
        title: 'Superman Legacy',
        description: 'A new era for the Man of Steel begins as Clark Kent balances his dual life.',
        genre: ['Action', 'Adventure', 'Sci-Fi'],
        language: ['English', 'Hindi'],
        duration: 130,
        releaseDate: new Date('2026-08-01'),
        poster: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        banner: 'https://image.tmdb.org/t/p/original/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
        trailer: 'https://www.youtube.com/watch?v=YurFnCqEzcY',
        rating: 7.5, status: 'Upcoming', format: ['2D', 'IMAX 2D', '4DX'],
      },
      // ── COMING SOON (2 movies) ──────────────────────────────────────
      {
        title: 'A Quiet Place: Day One',
        description: 'Experience the day the world went quiet as New York City falls under attack.',
        genre: ['Horror', 'Thriller', 'Sci-Fi'],
        language: ['English', 'Hindi'],
        duration: 99,
        releaseDate: new Date('2026-09-28'),
        poster: 'https://image.tmdb.org/t/p/w500/sFmSJnbCqRYlvHkJpLl8TpFXsGo.jpg',
        banner: 'https://image.tmdb.org/t/p/original/sFmSJnbCqRYlvHkJpLl8TpFXsGo.jpg',
        trailer: 'https://www.youtube.com/watch?v=9ByEjFgWmno',
        rating: 7.5, status: 'Coming Soon', format: ['2D', 'IMAX 2D'],
      },
      {
        title: 'Deadpool & Wolverine 2',
        description: 'Wade Wilson and Logan team up again for another wild multiverse adventure.',
        genre: ['Action', 'Comedy', 'Sci-Fi'],
        language: ['English', 'Hindi'],
        duration: 127,
        releaseDate: new Date('2026-10-15'),
        poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        banner: 'https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        trailer: 'https://www.youtube.com/watch?v=73_1biulkYk',
        rating: 8.5, status: 'Coming Soon', format: ['2D', 'IMAX 2D', '4DX'],
      },
    ];

    let insertedCount = 0;
    let skippedCount  = 0;
    for (const movieData of moviesData) {
      const exists = await Movie.findOne({ title: movieData.title });
      if (!exists) {
        await Movie.create(movieData);
        insertedCount++;
        console.log(`✅ Created: ${movieData.title}`);
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped (already exists): ${movieData.title}`);
      }
    }
    console.log(`\nMovies: ${insertedCount} created, ${skippedCount} skipped`);

    // ── THEATRES: only insert if none exist ──────────────────────────
    const theatreCount = await Theatre.countDocuments();
    if (theatreCount === 0) {
      const theatresData = [
        { name: 'PVR Nexus Mall',         location: 'Koramangala', city: 'Chennai', screens: 5, totalSeats: 100, status: 'Active', amenities: ['Dolby Atmos', '4K', 'IMAX', 'Recliner'] },
        { name: 'INOX VR Mall',           location: 'Anna Nagar',  city: 'Chennai', screens: 4, totalSeats: 100, status: 'Active', amenities: ['Dolby Atmos', '3D', 'Premium'] },
        { name: 'PVR Phoenix MarketCity', location: 'Velachery',   city: 'Chennai', screens: 6, totalSeats: 100, status: 'Active', amenities: ['IMAX', '4DX', 'Dolby Atmos', 'Recliner'] },
        { name: 'Sathyam Cinemas',        location: 'T. Nagar',    city: 'Chennai', screens: 4, totalSeats: 100, status: 'Active', amenities: ['Dolby', '3D', 'Lounge'] },
        { name: 'AGS Cinemas',            location: 'T. Nagar',    city: 'Chennai', screens: 3, totalSeats: 100, status: 'Active', amenities: ['Standard', '2D', '3D'] },
      ];
      await Theatre.insertMany(theatresData);
      console.log(`✅ ${theatresData.length} Theatres created (100 seats each)`);
    } else {
      await Theatre.updateMany({}, { $set: { totalSeats: 100 } });
      console.log(`⏭️  Theatres already exist (${theatreCount}) — updated totalSeats to 100`);
    }

    // ── SHOWS: clear old shows & recreate with lean, clean set ───────
    //
    // STRATEGY (keeps admin panel clean):
    //   • Now Showing  → 1 show per movie, at 1 theatre each, for TODAY only
    //   • Upcoming     → 1 show per movie, at 1 theatre each, on their release date
    //   • Coming Soon  → NO shows (trailers only — not released yet)
    //
    // Total: 6 + 3 = 9 shows maximum — easy to manage in admin
    //
    await Show.deleteMany({});
    console.log('🗑️  Cleared old shows');

    const theatres = await Theatre.find({});
    if (theatres.length === 0) {
      console.log('⚠️  No theatres found — skipping show creation');
      process.exit(0);
    }

    const TOTAL_SEATS = 100;
    const showsData   = [];

    // ── NOW SHOWING: 1 show per movie × 1 theatre, today ─────────────
    // Each movie gets assigned to a different theatre (round-robin)
    const nowShowingConfig = [
      { title: 'Kalki 2898 AD',              time: '10:30 AM', format: '2D',      language: 'Telugu',  price: 150, theatreIndex: 0 },
      { title: 'Furiosa: A Mad Max Saga',    time: '01:30 PM', format: 'IMAX 2D', language: 'English', price: 250, theatreIndex: 1 },
      { title: 'Avengers: Endgame',          time: '04:30 PM', format: '4DX',     language: 'English', price: 300, theatreIndex: 2 },
      { title: 'Interstellar',               time: '07:30 PM', format: '2D',      language: 'English', price: 150, theatreIndex: 3 },
      { title: 'Oppenheimer',                time: '10:30 AM', format: 'IMAX 2D', language: 'English', price: 250, theatreIndex: 4 },
      { title: 'The Shawshank Redemption',   time: '04:30 PM', format: '2D',      language: 'English', price: 150, theatreIndex: 0 },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const cfg of nowShowingConfig) {
      const movie = await Movie.findOne({ title: cfg.title });
      if (!movie) { console.log(`⚠️  Movie not found: ${cfg.title}`); continue; }

      const theatre    = theatres[cfg.theatreIndex % theatres.length];
      const bookedCount = Math.floor(Math.random() * 30); // 0–29 booked

      showsData.push({
        movie:          movie._id,
        theatre:        theatre._id,
        date:           new Date(today),
        time:           cfg.time,
        format:         cfg.format,
        language:       cfg.language,
        totalSeats:     TOTAL_SEATS,
        availableSeats: TOTAL_SEATS - bookedCount,
        bookedSeats:    [],
        price:          cfg.price,
        status:         'Active',
      });
    }

    // ── UPCOMING: 1 show per movie × 1 theatre, on release date ──────
    const upcomingConfig = [
      { title: 'Bhairava',        releaseDate: new Date('2026-06-15'), time: '07:30 PM', format: '2D',      language: 'Tamil',   price: 150, theatreIndex: 1 },
      { title: 'Inside Out 2',    releaseDate: new Date('2026-07-14'), time: '04:30 PM', format: '2D',      language: 'English', price: 150, theatreIndex: 2 },
      { title: 'Superman Legacy', releaseDate: new Date('2026-08-01'), time: '07:30 PM', format: 'IMAX 2D', language: 'English', price: 250, theatreIndex: 3 },
    ];

    for (const cfg of upcomingConfig) {
      const movie = await Movie.findOne({ title: cfg.title });
      if (!movie) { console.log(`⚠️  Movie not found: ${cfg.title}`); continue; }

      const theatre = theatres[cfg.theatreIndex % theatres.length];
      const releaseDay = new Date(cfg.releaseDate);
      releaseDay.setHours(0, 0, 0, 0);

      showsData.push({
        movie:          movie._id,
        theatre:        theatre._id,
        date:           releaseDay,
        time:           cfg.time,
        format:         cfg.format,
        language:       cfg.language,
        totalSeats:     TOTAL_SEATS,
        availableSeats: TOTAL_SEATS,   // 0 booked — not released yet
        bookedSeats:    [],
        price:          cfg.price,
        status:         'Active',
      });
    }

    // ── Coming Soon movies: NO shows (just visible in movie listing) ──

    await Show.insertMany(showsData);
    console.log(`✅ ${showsData.length} Shows created`);

    console.log('\n=======================================');
    console.log('   DATABASE SEEDING COMPLETE!');
    console.log('=======================================');
    console.log('  ADMIN: jagadeeshakash171@gmail.com / Admin@123');
    console.log('  USER:  testuser.bms@gmail.com / User@123');
    console.log('=======================================');
    console.log(`  ✅ Now Showing: 6 shows (1 per movie, today)`);
    console.log(`  ✅ Upcoming:    3 shows (1 per movie, on release date)`);
    console.log(`  ✅ Coming Soon: 0 shows (no tickets yet)`);
    console.log(`  ✅ Total shows: ${showsData.length}`);
    console.log('=======================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();