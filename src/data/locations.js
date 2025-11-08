// Australian suburbs and postcodes for auto-suggestions
export const australianLocations = [
  // NSW - Sydney Metro
  { suburb: 'Parramatta', postcode: '2150', state: 'NSW' },
  { suburb: 'Sydney', postcode: '2000', state: 'NSW' },
  { suburb: 'Blacktown', postcode: '2148', state: 'NSW' },
  { suburb: 'Penrith', postcode: '2750', state: 'NSW' },
  { suburb: 'Liverpool', postcode: '2170', state: 'NSW' },
  { suburb: 'Bondi Junction', postcode: '2022', state: 'NSW' },
  { suburb: 'Chatswood', postcode: '2067', state: 'NSW' },
  { suburb: 'North Sydney', postcode: '2060', state: 'NSW' },
  { suburb: 'Bankstown', postcode: '2200', state: 'NSW' },
  { suburb: 'Castle Hill', postcode: '2154', state: 'NSW' },
  { suburb: 'Campbelltown', postcode: '2560', state: 'NSW' },
  { suburb: 'Cronulla', postcode: '2230', state: 'NSW' },
  { suburb: 'Manly', postcode: '2095', state: 'NSW' },
  { suburb: 'Hornsby', postcode: '2077', state: 'NSW' },
  { suburb: 'Ryde', postcode: '2112', state: 'NSW' },
  { suburb: 'Hurstville', postcode: '2220', state: 'NSW' },
  { suburb: 'Strathfield', postcode: '2135', state: 'NSW' },
  { suburb: 'Auburn', postcode: '2144', state: 'NSW' },
  { suburb: 'Burwood', postcode: '2134', state: 'NSW' },
  { suburb: 'Epping', postcode: '2121', state: 'NSW' },

  // VIC - Melbourne
  { suburb: 'Melbourne', postcode: '3000', state: 'VIC' },
  { suburb: 'Geelong', postcode: '3220', state: 'VIC' },
  { suburb: 'Ballarat', postcode: '3350', state: 'VIC' },
  { suburb: 'Bendigo', postcode: '3550', state: 'VIC' },
  { suburb: 'Frankston', postcode: '3199', state: 'VIC' },
  { suburb: 'Box Hill', postcode: '3128', state: 'VIC' },
  { suburb: 'Dandenong', postcode: '3175', state: 'VIC' },
  { suburb: 'Preston', postcode: '3072', state: 'VIC' },
  { suburb: 'St Kilda', postcode: '3182', state: 'VIC' },
  { suburb: 'Richmond', postcode: '3121', state: 'VIC' },
  { suburb: 'Footscray', postcode: '3011', state: 'VIC' },
  { suburb: 'Clayton', postcode: '3168', state: 'VIC' },
  { suburb: 'Ringwood', postcode: '3134', state: 'VIC' },

  // QLD - Brisbane & Gold Coast
  { suburb: 'Brisbane City', postcode: '4000', state: 'QLD' },
  { suburb: 'Sunnybank', postcode: '4109', state: 'QLD' },
  { suburb: 'Gold Coast', postcode: '4217', state: 'QLD' },
  { suburb: 'Sunshine Coast', postcode: '4558', state: 'QLD' },
  { suburb: 'Chermside', postcode: '4032', state: 'QLD' },
  { suburb: 'Logan', postcode: '4114', state: 'QLD' },
  { suburb: 'Redcliffe', postcode: '4020', state: 'QLD' },
  { suburb: 'Southport', postcode: '4215', state: 'QLD' },
  { suburb: 'Surfers Paradise', postcode: '4217', state: 'QLD' },

  // QLD - Ipswich & Springfield Region (Service Area)
  { suburb: 'Ipswich', postcode: '4305', state: 'QLD' },
  { suburb: 'Springfield', postcode: '4300', state: 'QLD' },
  { suburb: 'Springfield Lakes', postcode: '4300', state: 'QLD' },
  { suburb: 'Spring Mountain', postcode: '4300', state: 'QLD' },
  { suburb: 'Ripley', postcode: '4306', state: 'QLD' },
  { suburb: 'Redbank Plains', postcode: '4301', state: 'QLD' },
  { suburb: 'Richlands', postcode: '4077', state: 'QLD' },
  { suburb: 'Forest Lake', postcode: '4078', state: 'QLD' },
  { suburb: 'Camira', postcode: '4300', state: 'QLD' },
  { suburb: 'Carole Park', postcode: '4300', state: 'QLD' },
  { suburb: 'Greenbank', postcode: '4124', state: 'QLD' },
  { suburb: 'New Beith', postcode: '4124', state: 'QLD' },
  { suburb: 'White Rock', postcode: '4306', state: 'QLD' },
  { suburb: 'Augustine Heights', postcode: '4300', state: 'QLD' },
  { suburb: 'Brookwater', postcode: '4300', state: 'QLD' },
  { suburb: 'Wacol', postcode: '4076', state: 'QLD' },
  { suburb: 'Inala', postcode: '4077', state: 'QLD' },
  { suburb: 'Boronia Heights', postcode: '4124', state: 'QLD' },
  { suburb: 'Browns Plains', postcode: '4118', state: 'QLD' },
  { suburb: 'Bundamba', postcode: '4304', state: 'QLD' },
  { suburb: 'Yamanto', postcode: '4305', state: 'QLD' },
  { suburb: 'Deebing Heights', postcode: '4306', state: 'QLD' },
  { suburb: 'Brassall', postcode: '4305', state: 'QLD' },
  { suburb: 'Collingwood Park', postcode: '4301', state: 'QLD' },
  { suburb: 'Bellbird Park', postcode: '4300', state: 'QLD' },
  { suburb: 'Goodna', postcode: '4300', state: 'QLD' },
  { suburb: 'Ellen Grove', postcode: '4078', state: 'QLD' },
  { suburb: 'South Ripley', postcode: '4306', state: 'QLD' },
  { suburb: 'Raceview', postcode: '4305', state: 'QLD' },
  { suburb: 'Hillcrest', postcode: '4118', state: 'QLD' },
  { suburb: 'Doolandella', postcode: '4077', state: 'QLD' },

  // QLD - Other Cities
  { suburb: 'Toowoomba', postcode: '4350', state: 'QLD' },
  { suburb: 'Cairns', postcode: '4870', state: 'QLD' },
  { suburb: 'Townsville', postcode: '4810', state: 'QLD' },

  // SA - Adelaide
  { suburb: 'Adelaide', postcode: '5000', state: 'SA' },
  { suburb: 'Glenelg', postcode: '5045', state: 'SA' },
  { suburb: 'Port Adelaide', postcode: '5015', state: 'SA' },
  { suburb: 'Marion', postcode: '5043', state: 'SA' },
  { suburb: 'Elizabeth', postcode: '5112', state: 'SA' },
  { suburb: 'Salisbury', postcode: '5108', state: 'SA' },
  { suburb: 'Mount Gambier', postcode: '5290', state: 'SA' },

  // WA - Perth
  { suburb: 'Perth', postcode: '6000', state: 'WA' },
  { suburb: 'Fremantle', postcode: '6160', state: 'WA' },
  { suburb: 'Joondalup', postcode: '6027', state: 'WA' },
  { suburb: 'Mandurah', postcode: '6210', state: 'WA' },
  { suburb: 'Bunbury', postcode: '6230', state: 'WA' },
  { suburb: 'Albany', postcode: '6330', state: 'WA' },
  { suburb: 'Rockingham', postcode: '6168', state: 'WA' },
  { suburb: 'Cannington', postcode: '6107', state: 'WA' },

  // ACT - Canberra
  { suburb: 'Canberra', postcode: '2600', state: 'ACT' },
  { suburb: 'Civic', postcode: '2601', state: 'ACT' },
  { suburb: 'Belconnen', postcode: '2617', state: 'ACT' },
  { suburb: 'Tuggeranong', postcode: '2900', state: 'ACT' },
  { suburb: 'Woden', postcode: '2606', state: 'ACT' },
  { suburb: 'Gungahlin', postcode: '2912', state: 'ACT' },

  // TAS - Hobart
  { suburb: 'Hobart', postcode: '7000', state: 'TAS' },
  { suburb: 'Launceston', postcode: '7250', state: 'TAS' },
  { suburb: 'Burnie', postcode: '7320', state: 'TAS' },
  { suburb: 'Devonport', postcode: '7310', state: 'TAS' },

  // NT - Darwin
  { suburb: 'Darwin', postcode: '0800', state: 'NT' },
  { suburb: 'Palmerston', postcode: '0830', state: 'NT' },
  { suburb: 'Alice Springs', postcode: '0870', state: 'NT' }
];

export const searchLocations = (query) => {
  if (!query || query.length < 2) return [];

  const searchTerm = query.toLowerCase();

  return australianLocations.filter(location =>
    location.suburb.toLowerCase().includes(searchTerm) ||
    location.postcode.includes(searchTerm)
  ).slice(0, 8); // Return max 8 suggestions
};

export const formatLocation = (location) => {
  return `${location.suburb}, ${location.state} ${location.postcode}`;
};
