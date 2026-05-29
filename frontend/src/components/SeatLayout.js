import React from 'react';

const SeatLayout = ({
	rows = ['A','B','C','D','E','F','G','H'],
	cols = 10,
	bookedSeats = [],
	selectedSeats = [],
	onToggleSeat = () => {},
	aisleAfter = 5,
	showRowLabels = true,
	wrapperStyle = {},
}) => {
	return (
		<div style={{ overflowX: 'auto', ...wrapperStyle }}>
			<div style={{ minWidth: 520 }}>
				{rows.map(row => (
					<div key={row} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, justifyContent: 'center' }}>
						{showRowLabels && (
							<span style={{ width: 20, fontSize: 12, color: '#666688', fontWeight: 600 }}>{row}</span>
						)}
						{Array.from({ length: cols }, (_, i) => {
							const seatId = `${row}${i + 1}`;
							const isBooked = bookedSeats.includes(seatId);
							const isSelected = selectedSeats.includes(seatId);
							return (
								<React.Fragment key={seatId}>
									{i === aisleAfter && <div style={{ width: 16 }} />}
									<div
										className={`seat ${isBooked ? 'booked' : isSelected ? 'selected' : 'available'}`}
										onClick={() => { if (!isBooked) onToggleSeat(seatId); }}
										title={seatId}
										role="button"
										aria-pressed={isSelected}
									>
										{i + 1}
									</div>
								</React.Fragment>
							);
						})}
					</div>
				))}
			</div>
		</div>
	);
};

export default SeatLayout;

