export const event = {
  name: 'Elizabeth @ 40',
  celebrant: 'Elizabeth Olufunke Adams',
  tagline: "Celebrating God's Faithfulness",
  startsAt: '2026-10-16T17:00:00-07:00',
  dateLabel: 'Friday, 16 October 2026',

  schedule: [
    { time: '4:30 PM', title: 'Cocktail hour', note: 'Arrive, be greeted, find your people.' },
    { time: '5:00 PM', title: 'The celebration begins', note: 'Dinner, dancing and everything after.' },
  ],

  venue: {
    name: 'London Events',
    street: '2155 E Cheyenne Ave',
    city: 'Las Vegas, NV 89030',
    directions: 'https://maps.google.com/?q=2155+E+Cheyenne+Ave,+Las+Vegas,+NV+89030',
  },

  hosts: [
    { role: 'MC', name: 'Mr Wamilele' },
    { role: 'On the decks', name: 'Celebrity DJ Major League' },
  ],

  dressCode: {
    label: 'Colour of the day',
    colour: 'Orange',
    note: 'Wear it boldly. Any shade, any fabric, head to toe or a single accent.',
    swatches: [
      { name: 'Burnt orange', hex: '#C2410C' },
      { name: 'Marigold',     hex: '#F59E0B' },
      { name: 'Tangerine',    hex: '#FF6A13' },
      { name: 'Apricot',      hex: '#FFB067' },
    ],
  },

  rsvp: 'https://rsvp.online/id/NTc5MDcx',

  thankYou: [
    "Forty years of God's faithfulness, and not one of them walked alone.",
    "Thank you for saying yes. For the flights booked, the outfits planned, the time taken out of your own full lives to stand with me on this day. I know what it costs to show up, and I don't take it lightly.",
    "Come ready to eat well, dance long, and laugh until your face hurts. That's the whole plan.",
    'See you in Las Vegas.',
  ],
  signature: 'Elizabeth',
} as const;

export const featured = {
  hero: 'img-8013',
  numerals: ['img-8268', 'img-8256', 'img-8283', 'img-8286'],

  storyPortrait: 'img-8268',
  storyFamily: 'img-2682',   

  closing: ['img-8286', 'img-8274'],
  backdrops: ['img-3324', 'img-2693', 'img-8264'],
} as const;
