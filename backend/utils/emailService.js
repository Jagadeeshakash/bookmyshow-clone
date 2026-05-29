const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const extractBookingData = (booking) => {
  const movie   = booking?.movie   || booking?.show?.movie;
  const theatre = booking?.theatre || booking?.show?.theatre;
  const user    = booking?.user;
  const show    = booking?.show;
  return { movie, theatre, user, show };
};

// ─── Generate Professional Movie Ticket PDF ───────────────────────────────────
const generatePDFBuffer = (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const { movie, theatre, user, show } = extractBookingData(booking);
      const seats = Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats;
      const showDate = show?.date
        ? new Date(show.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

      // ✅ coupon fields
      const couponCode     = booking.couponCode     || null;
      const couponDiscount = booking.couponDiscount || 0;

      const W = 595, H = couponCode && couponDiscount > 0 ? 245 : 220;
      const doc = new PDFDocument({ margin: 0, size: [W, H] });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ── LEFT SECTION (red background) ──────────────────────────────────────
      const leftW = 370;
      doc.rect(0, 0, leftW, H).fill('#cc0000');

      // Diagonal dark stripe
      doc.save();
      doc.rect(0, 0, leftW, H).clip();
      doc.moveTo(leftW - 80, 0).lineTo(leftW, 0).lineTo(leftW - 30, H).lineTo(leftW - 110, H).fill('rgba(0,0,0,0.15)');
      doc.restore();

      // Logo
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text('BOOKMYSHOW', 22, 18);
      doc.fillColor('rgba(255,255,255,0.7)').fontSize(7).font('Helvetica').text('www.bookmyshow.com  |  support@bookmyshow.com', 22, 32);

      // Movie title
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(
        (movie?.title || 'MOVIE').toUpperCase(), 22, 55, { width: leftW - 44, lineGap: 2 }
      );

      // Format / language tag
      const tag = [show?.format, show?.language].filter(Boolean).join(' • ') || 'Standard';
      doc.fillColor('rgba(255,255,255,0.75)').fontSize(9).font('Helvetica-Oblique').text(tag, 22, 100);

      // Divider
      doc.moveTo(22, 115).lineTo(leftW - 30, 115).strokeColor('rgba(255,255,255,0.3)').lineWidth(0.5).stroke();

      // Info row: SEAT | TIME | DATE
      const infoY = 128;
      const col = [22, 110, 210];

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(7).font('Helvetica-Bold').text('SEAT', col[0], infoY);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(seats, col[0], infoY + 12);

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(7).font('Helvetica-Bold').text('TIME', col[1], infoY);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(show?.time || 'N/A', col[1], infoY + 12);

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(7).font('Helvetica-Bold').text('DATE', col[2], infoY);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(showDate, col[2], infoY + 12);

      // Theatre
      doc.fillColor('rgba(255,255,255,0.6)').fontSize(7).font('Helvetica-Bold').text('THEATRE', col[0], infoY + 40);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(theatre?.name || 'N/A', col[0], infoY + 52, { width: 200 });

      // ✅ Coupon strip (only if applied)
      if (couponCode && couponDiscount > 0) {
        const couponY = infoY + 72;
        doc.rect(22, couponY, leftW - 44, 18).fill('rgba(0,0,0,0.25)');
        doc.fillColor('rgba(255,255,255,0.7)').fontSize(7).font('Helvetica-Bold')
          .text(`🏷  COUPON: ${couponCode}   |   SAVED: Rs. ${couponDiscount}`, 28, couponY + 5);
      }

      // Amount — always at bottom
      doc.fillColor('rgba(255,255,255,0.85)').fontSize(13).font('Helvetica-Bold')
        .text(`ADMIT: Rs. ${booking.totalAmount}`, 22, H - 28);

      // ── PERFORATION ────────────────────────────────────────────────────────
      const sepX = leftW;
      doc.moveTo(sepX, 0).lineTo(sepX, H).strokeColor('#ffffff').lineWidth(1.5).dash(6, { space: 5 }).stroke();
      doc.undash();

      // ── RIGHT SECTION (dark) ───────────────────────────────────────────────
      doc.rect(leftW, 0, W - leftW, H).fill('#1a1a1a');

      // Rotated movie title
      doc.save();
      doc.translate(W - 30, H - 20);
      doc.rotate(-90);
      doc.fillColor('#cc0000').fontSize(11).font('Helvetica-Bold')
        .text((movie?.title || 'MOVIE').toUpperCase(), 0, 0, { width: H - 40 });
      doc.restore();

      const rx = leftW + 18;
      let ry = 20;

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(8).font('Helvetica-Bold').text('DATE', rx, ry);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(showDate, rx, ry + 12);
      ry += 44;

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(8).font('Helvetica-Bold').text('TIME', rx, ry);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(show?.time || 'N/A', rx, ry + 12);
      ry += 44;

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(8).font('Helvetica-Bold').text('SEAT', rx, ry);
      doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(seats, rx, ry + 12);
      ry += 44;

      doc.fillColor('rgba(255,255,255,0.6)').fontSize(8).font('Helvetica-Bold').text('TICKET NO.', rx, ry);
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(
        booking._id.toString().slice(-10).toUpperCase(), rx, ry + 12
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ─── Ticket Email HTML ────────────────────────────────────────────────────────
const generateTicketEmailHTML = (booking) => {
  const { movie, theatre, user, show } = extractBookingData(booking);
  const { _id, seats, totalAmount, paymentMethod, couponCode, couponDiscount } = booking;

  const bookingDateFormatted = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const showDate = show?.date
    ? new Date(show.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  // ✅ Coupon row — only shown if applied
  const couponRow = couponCode && couponDiscount > 0 ? `
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:13px;background:#e8f5e9;border:1px solid #a5d6a7;padding:10px 14px;border-radius:8px;">
      <span style="color:#2e7d32;font-weight:700;">🏷️ Coupon Applied: ${couponCode}</span>
      <span style="color:#2e7d32;font-weight:800;">-₹${couponDiscount}</span>
    </div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;color:#333;}
    .wrapper{max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);}
    .header{background:linear-gradient(135deg,#cc0000,#ff3366);padding:30px 20px;text-align:center;}
    .header .logo{font-size:28px;font-weight:800;color:#fff;}
    .header .logo span{color:#ffccd5;}
    .header p{color:rgba(255,255,255,0.85);margin-top:6px;font-size:14px;}
    .ticket-body{padding:30px;}
    .success-badge{display:inline-block;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:20px;}
    .movie-title{font-size:24px;font-weight:700;color:#cc0000;margin-bottom:6px;}
    .booking-id{font-size:12px;color:#888;margin-bottom:24px;}
    .divider{border:none;border-top:2px dashed #eee;margin:20px 0;}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;}
    .detail-item label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;display:block;margin-bottom:4px;}
    .detail-item span{font-size:15px;font-weight:600;color:#222;}
    .seats-box{background:#fff8f8;border:1px solid #ffd6d6;border-radius:8px;padding:14px 18px;margin-bottom:20px;}
    .seats-box label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;display:block;margin-bottom:6px;}
    .seat-tags{display:flex;flex-wrap:wrap;gap:8px;}
    .seat-tag{background:#cc0000;color:#fff;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;}
    .amount-box{background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;}
    .amount-box .label{color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:1px;}
    .amount-box .amount{color:#ff6384;font-size:32px;font-weight:800;margin-top:4px;}
    .note-box{background:#fffde7;border-left:4px solid #ffc107;padding:14px 18px;border-radius:0 8px 8px 0;font-size:13px;color:#555;line-height:1.6;margin-bottom:24px;}
    .footer{background:#f8f8f8;padding:20px;text-align:center;border-top:1px solid #eee;}
    .footer p{font-size:12px;color:#aaa;line-height:1.8;}
    .footer a{color:#cc0000;text-decoration:none;}
    .pdf-notice{background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#1565c0;}
  </style></head><body>
  <div class="wrapper">
    <div class="header"><div class="logo">Book<span>MyShow</span></div><p>Your ticket is confirmed! 🎬</p></div>
    <div class="ticket-body">
      <div class="success-badge">✅ Booking Confirmed</div>
      <div class="movie-title">${movie?.title || 'Movie'}</div>
      <div class="booking-id">Booking ID: <strong>${_id}</strong> &nbsp;|&nbsp; Booked on: ${bookingDateFormatted}</div>
      <div class="pdf-notice">📎 <strong>Your PDF ticket is attached</strong> to this email. Please carry it to the theatre.</div>
      <hr class="divider"/>
      <div class="detail-grid">
        <div class="detail-item"><label>Theatre</label><span>${theatre?.name || 'N/A'}</span></div>
        <div class="detail-item"><label>Location</label><span>${theatre?.location || 'N/A'}, ${theatre?.city || ''}</span></div>
        <div class="detail-item"><label>Show Date</label><span>${showDate}</span></div>
        <div class="detail-item"><label>Show Time</label><span>${show?.time || 'N/A'}</span></div>
        <div class="detail-item"><label>Format</label><span>${show?.format || 'N/A'}</span></div>
        <div class="detail-item"><label>Language</label><span>${show?.language || 'N/A'}</span></div>
      </div>
      <div class="seats-box">
        <label>Your Seats</label>
        <div class="seat-tags">
          ${Array.isArray(seats) ? seats.map(s=>`<span class="seat-tag">${s}</span>`).join('') : `<span class="seat-tag">${seats}</span>`}
        </div>
      </div>
      ${couponRow}
      <div class="amount-box">
        <div class="label">Amount Paid</div>
        <div class="amount">&#8377;${totalAmount}</div>
        ${couponCode && couponDiscount > 0 ? `<div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:6px;">🏷️ Saved ₹${couponDiscount} with coupon ${couponCode}</div>` : ''}
      </div>
      <div style="background:#f0f7ff;border:1px solid #bee3f8;border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:13px;">
        <strong>👤 Booked by:</strong> ${user?.name || 'Customer'} (${user?.email || ''})<br/>
        <strong>💳 Payment:</strong> ${paymentMethod || 'Online'}
      </div>
      <div class="note-box">📋 <strong>Important:</strong> Please carry the attached PDF ticket to the theatre. Arrive at least 15 minutes before showtime.</div>
    </div>
    <div class="footer"><p>Need help? <a href="mailto:support@bookmyshow.com">support@bookmyshow.com</a><br/>&copy; ${new Date().getFullYear()} BookMyShow. All rights reserved.</p></div>
  </div></body></html>`;
};

// ─── Send Ticket Email with PDF ───────────────────────────────────────────────
const sendTicketEmail = async (booking) => {
  try {
    const transporter = createTransporter();
    const { movie, user } = extractBookingData(booking);
    const userEmail  = user?.email;
    const movieTitle = movie?.title || 'Movie';

    if (!userEmail) {
      console.warn('⚠️ No user email found — skipping ticket email');
      return;
    }

    let pdfBuffer = null;
    try {
      pdfBuffer = await generatePDFBuffer(booking);
      console.log('✅ PDF ticket generated');
    } catch (pdfErr) {
      console.error('⚠️ PDF generation failed:', pdfErr.message);
    }

    const mailOptions = {
      from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎬 Your Ticket for ${movieTitle} — Booking Confirmed!`,
      html: generateTicketEmailHTML(booking),
      attachments: pdfBuffer
        ? [{ filename: `BookMyShow_Ticket_${booking._id}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
        : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket email sent to ${userEmail} — MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('❌ Failed to send ticket email:', err.message);
  }
};

module.exports = { sendTicketEmail, generateTicketEmailHTML, generatePDFBuffer };