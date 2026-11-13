/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',
      canvas: '#F5F6F8',
      surface: '#FFFFFF',
      ink: '#111318',
      stone: '#6B7280',
      wire: '#DCDFE5',
      signal: '#CF222E',
      'idle-red': '#CF222E',
      'spike-amber': '#BF8700',
      'oversized-orange': '#BC4C00',
      'reserved-teal': '#0E6E62',
      'savings-green': '#1A7F37',
      /* Chart service palette */
      'svc-ec2': '#3D6CDA',
      'svc-s3': '#2EA17B',
      'svc-lambda': '#C48B2C',
      'svc-rds': '#A8437A',
      'svc-gcp': '#6554A5',
      'svc-azure': '#2898A4',
    },
    fontFamily: {
      display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      'display': ['18px', { lineHeight: '24px', fontWeight: '600' }],
      'heading': ['14px', { lineHeight: '20px', fontWeight: '600' }],
      'label': ['11px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.05em' }],
      'body': ['13px', { lineHeight: '20px', fontWeight: '400' }],
      'caption': ['11px', { lineHeight: '16px', fontWeight: '400' }],
      'mono-lg': ['20px', { lineHeight: '28px', fontWeight: '500' }],
      'mono-md': ['13px', { lineHeight: '20px', fontWeight: '400' }],
      'mono-sm': ['11px', { lineHeight: '16px', fontWeight: '400' }],
    },
    borderRadius: {
      'none': '0',
      'sm': '2px',
      'DEFAULT': '4px',
      'md': '6px',
      'full': '9999px',
    },
    extend: {
      spacing: {
        '18': '4.5rem',
      },
      maxWidth: {
        'dash': '1480px',
      },
    },
  },
  plugins: [],
};
