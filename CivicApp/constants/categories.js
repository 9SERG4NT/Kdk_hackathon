export const CATEGORIES = [
  { value: 'pothole', label: 'Pothole', icon: 'alert-circle', color: '#E74C3C' },
  { value: 'garbage', label: 'Garbage', icon: 'trash-2', color: '#F39C12' },
  { value: 'water_leakage', label: 'Water Leakage', icon: 'droplet', color: '#3498DB' },
  { value: 'streetlight', label: 'Streetlight', icon: 'zap', color: '#F1C40F' },
  { value: 'road_damage', label: 'Road Damage', icon: 'alert-triangle', color: '#E67E22' },
  { value: 'sewage', label: 'Sewage', icon: 'cloud-drizzle', color: '#8E44AD' },
  { value: 'public_safety', label: 'Public Safety', icon: 'shield', color: '#1ABC9C' },
  { value: 'other', label: 'Other', icon: 'more-horizontal', color: '#95A5A6' },
];

export const STATUS_COLORS = {
  reported: '#E74C3C',
  in_review: '#F39C12',
  resolved: '#2ECC71',
  rejected: '#95A5A6',
};

export const STATUS_LABELS = {
  reported: 'Reported',
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const SEVERITY_COLORS = {
  low: '#3498DB',
  medium: '#F39C12',
  high: '#E74C3C',
  critical: '#8E44AD',
};
