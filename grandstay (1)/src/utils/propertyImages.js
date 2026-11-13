import heroGrandResort from '../assets/images/hero_grand_resort_1794561804068.jpg';
import hotelRoyalPalace from '../assets/images/hotel_royal_palace_1794561805206.jpg';
import hotelAlpineRetreat from '../assets/images/hotel_alpine_retreat_1794561805663.jpg';
import hotelBackwaterSanctuary from '../assets/images/hotel_backwater_sanctuary_1794561806069.jpg';
import villaPalmCove from '../assets/images/villa_palm_cove_1794561806135.jpg';
import tourHeritageTrail from '../assets/images/tour_heritage_trail_1794561807056.jpg';

const ASSET_MAP = {
  '/src/assets/images/hero_grand_resort_1794561804068.jpg': heroGrandResort,
  '/src/assets/images/hotel_royal_palace_1794561805206.jpg': hotelRoyalPalace,
  '/src/assets/images/hotel_alpine_retreat_1794561805663.jpg': hotelAlpineRetreat,
  '/src/assets/images/hotel_backwater_sanctuary_1794561806069.jpg': hotelBackwaterSanctuary,
  '/src/assets/images/villa_palm_cove_1794561806135.jpg': villaPalmCove,
  '/src/assets/images/tour_heritage_trail_1794561807056.jpg': tourHeritageTrail,
};

export function resolveMediaUrl(path) {
  if (!path) return heroGrandResort;
  return ASSET_MAP[path] || path;
}

export function formatINR(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatDateShort(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getDefaultDates() {
  const today = new Date();
  const checkIn = new Date(today.getTime() + 15 * 86400000);
  const checkOut = new Date(today.getTime() + 18 * 86400000);
  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  };
}

export { heroGrandResort };
