import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('./golf_data.json', 'utf8'));

const normalized = rawData.map(c => {
  const prices = c.prices || [];
  return {
    name: c.name,
    phone: c.phone || '',
    region: c.region || '',
    holes: c.holes || '18',
    website: c.website || '',
    hasCard: c.hasCard || false,
    hasWater: c.hasWater || false,
    hasRestaurant: c.hasRestaurant || false,
    member: prices[0] || '',
    guestWeekday: prices[1] || '',
    guestHoliday: prices[2] || '',
    memberGuestWeekday: prices[3] || '',
    memberGuestHoliday: prices[4] || '',
    teamWeekday: prices[5] || '',
    teamHoliday: prices[6] || '',
    updateDate: '115.1.7', // Defaulting to recent
    remarks: c.remarks || ''
  };
});

fs.writeFileSync('./src/data/golf_courses.json', JSON.stringify(normalized, null, 2));
console.log('Data synchronization complete. Total courses:', normalized.length);
