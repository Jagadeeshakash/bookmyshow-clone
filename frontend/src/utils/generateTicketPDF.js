import jsPDF from 'jspdf';

export const generateTicketPDF = (booking) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const {
    _id,
    show,
    seats,
    totalAmount,
    paymentId,
    paymentMethod,
    bookingDate,
    user,
    couponCode,
    couponDiscount,
  } = booking;

  // ✅ movie and theatre live inside show
  const movie   = show?.movie;
  const theatre = show?.theatre;

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const centerText = (text, y, size = 12, style = 'normal', color = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    doc.text(String(text), pageW / 2, y, { align: 'center' });
  };

  const leftText = (text, x, y, size = 11, style = 'normal', color = [0, 0, 0]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    doc.text(String(text), x, y);
  };

  // ── Header ─────────────────────────────────────────────────────────────────
  doc.setFillColor(180, 0, 0);
  doc.rect(0, 0, pageW, 45, 'F');
  doc.setFillColor(220, 20, 60);
  doc.rect(0, 38, pageW, 7, 'F');

  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Book', pageW / 2 - 14, 22, { align: 'right' });
  doc.setTextColor(255, 180, 190);
  doc.text('MyShow', pageW / 2 - 13, 22);

  centerText('Your Booking Confirmation Ticket', 34, 10, 'normal', [255, 220, 225]);

  // ── Card background ────────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 52, pageW - 24, pageH - 70, 4, 4, 'F');
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, 52, pageW - 24, pageH - 70, 4, 4, 'S');

  // ── Confirmed Badge ────────────────────────────────────────────────────────
  doc.setFillColor(232, 245, 233);
  doc.roundedRect(pageW / 2 - 26, 55, 52, 9, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(46, 125, 50);
  doc.text('✓ BOOKING CONFIRMED', pageW / 2, 61, { align: 'center' });

  // ── Movie title ────────────────────────────────────────────────────────────
  centerText(movie?.title || 'Movie', 76, 20, 'bold', [180, 0, 0]);
  centerText(`Booking ID: ${_id}`, 84, 8, 'normal', [150, 150, 150]);

  // ── Divider ────────────────────────────────────────────────────────────────
  doc.setDrawColor(220, 220, 220);
  doc.setLineDash([2, 2]);
  doc.line(20, 89, pageW - 20, 89);
  doc.setLineDash([]);

  // ── Info Grid ──────────────────────────────────────────────────────────────
  const col1X = 22;
  const col2X = pageW / 2 + 5;
  const labelColor = [140, 140, 140];
  const valueColor = [20, 20, 20];

  // Row 1
  leftText('THEATRE', col1X, 96, 7, 'bold', labelColor);
  leftText(theatre?.name || 'N/A', col1X, 102, 11, 'bold', valueColor);
  leftText('LOCATION', col2X, 96, 7, 'bold', labelColor);
  leftText(`${theatre?.location || ''}, ${theatre?.city || ''}`, col2X, 102, 11, 'bold', valueColor);

  // Row 2
  leftText('SHOW DATE', col1X, 112, 7, 'bold', labelColor);
  leftText(
    show?.date ? new Date(show.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    col1X, 118, 11, 'bold', valueColor
  );
  leftText('SHOW TIME', col2X, 112, 7, 'bold', labelColor);
  leftText(show?.time || 'N/A', col2X, 118, 11, 'bold', valueColor);

  // Row 3
  leftText('FORMAT', col1X, 128, 7, 'bold', labelColor);
  leftText(show?.format || 'N/A', col1X, 134, 11, 'bold', valueColor);
  leftText('LANGUAGE', col2X, 128, 7, 'bold', labelColor);
  leftText(show?.language || 'N/A', col2X, 134, 11, 'bold', valueColor);

  // ── Seats ──────────────────────────────────────────────────────────────────
  doc.setFillColor(255, 248, 248);
  doc.setDrawColor(255, 180, 180);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, 141, pageW - 40, 20, 3, 3, 'FD');
  leftText('YOUR SEATS', 26, 148, 7, 'bold', labelColor);
  const seatsStr = Array.isArray(seats) ? seats.join('   ') : String(seats);
  leftText(seatsStr, 26, 156, 12, 'bold', [180, 0, 0]);

  // ── Coupon section (only if used) ──────────────────────────────────────────
  let amountBoxY = 168;

  if (couponCode && couponDiscount > 0) {
    doc.setFillColor(232, 245, 233);
    doc.setDrawColor(0, 200, 83);
    doc.setLineWidth(0.3);
    doc.roundedRect(20, 164, pageW - 40, 16, 3, 3, 'FD');
    leftText('COUPON APPLIED', 26, 170, 7, 'bold', [46, 125, 50]);
    leftText(`${couponCode}  —  Saved ₹${couponDiscount}`, 26, 176, 10, 'bold', [0, 150, 60]);
    amountBoxY = 184;
  }

  // ── Amount box ─────────────────────────────────────────────────────────────
  doc.setFillColor(26, 26, 46);
  doc.roundedRect(20, amountBoxY, pageW - 40, 26, 3, 3, 'F');
  centerText('AMOUNT PAID', amountBoxY + 10, 8, 'normal', [180, 180, 220]);
  centerText(`Rs. ${totalAmount}`, amountBoxY + 21, 18, 'bold', [255, 100, 140]);

  // ── Payment info ───────────────────────────────────────────────────────────
  const payInfoY = amountBoxY + 34;
  doc.setDrawColor(220, 220, 220);
  doc.setLineDash([2, 2]);
  doc.line(20, payInfoY, pageW - 20, payInfoY);
  doc.setLineDash([]);

  leftText('PAYMENT METHOD', col1X, payInfoY + 9, 7, 'bold', labelColor);
  leftText(paymentMethod || 'Razorpay', col1X, payInfoY + 15, 10, 'bold', valueColor);

  if (paymentId) {
    leftText('PAYMENT ID', col2X, payInfoY + 9, 7, 'bold', labelColor);
    leftText(paymentId, col2X, payInfoY + 15, 9, 'normal', valueColor);
  }

  leftText('BOOKING DATE', col1X, payInfoY + 25, 7, 'bold', labelColor);
  leftText(
    bookingDate ? new Date(bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN'),
    col1X, payInfoY + 31, 10, 'bold', valueColor
  );

  if (user?.name) {
    leftText('BOOKED BY', col2X, payInfoY + 25, 7, 'bold', labelColor);
    leftText(user.name, col2X, payInfoY + 31, 10, 'bold', valueColor);
  }

  // ── Note strip ─────────────────────────────────────────────────────────────
  const noteY = payInfoY + 38;
  doc.setFillColor(255, 253, 231);
  doc.rect(20, noteY, 3, 20, 'F');
  doc.rect(23, noteY, pageW - 43, 20, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 90, 0);
  doc.text('IMPORTANT:', 26, noteY + 8);
  doc.setFont('helvetica', 'normal');
  doc.text('Please carry this ticket to the theatre. Arrive at least 15 minutes before showtime.', 26, noteY + 14);

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc.setFillColor(245, 245, 245);
  doc.rect(0, pageH - 18, pageW, 18, 'F');
  centerText('© BookMyShow | support@bookmyshow.com | System-generated ticket', pageH - 9, 7, 'normal', [180, 180, 180]);

  doc.save(`BookMyShow_Ticket_${_id}.pdf`);
};

export default generateTicketPDF;