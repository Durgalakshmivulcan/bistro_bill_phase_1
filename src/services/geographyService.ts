/**
 * Geography Service
 *
 * Provides country, state, and city data for form dropdowns.
 * Currently uses static data; can be replaced with API calls in the future.
 */

// ============================================
// Geography Data
// ============================================

const GEOGRAPHY_DATA: Record<string, Record<string, string[]>> = {
  India: {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kakinada', 'Rajahmundry'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubli', 'Belgaum', 'Dharwad', 'Shimoga'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Navi Mumbai'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Erode', 'Vellore'],
    'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam', 'Secunderabad'],
    'Delhi': ['New Delhi', 'Delhi'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida', 'Ghaziabad', 'Allahabad'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  },
  USA: {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    'Texas': ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Fort Worth'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    'Illinois': ['Chicago', 'Springfield', 'Naperville'],
    'Washington': ['Seattle', 'Tacoma', 'Spokane'],
  },
  UAE: {
    'Dubai': ['Dubai'],
    'Abu Dhabi': ['Abu Dhabi', 'Al Ain'],
    'Sharjah': ['Sharjah'],
  },
  UK: {
    'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds'],
    'Scotland': ['Edinburgh', 'Glasgow'],
    'Wales': ['Cardiff', 'Swansea'],
  },
  Singapore: {
    'Singapore': ['Singapore'],
  },
};

// ============================================
// Service Functions
// ============================================

/**
 * Get list of available countries
 */
export const getCountries = (): string[] => {
  return Object.keys(GEOGRAPHY_DATA);
};

/**
 * Get list of states for a given country
 */
export const getStates = (country: string): string[] => {
  return Object.keys(GEOGRAPHY_DATA[country] || {});
};

/**
 * Get list of cities for a given country and state
 */
export const getCities = (country: string, state: string): string[] => {
  return GEOGRAPHY_DATA[country]?.[state] || [];
};
