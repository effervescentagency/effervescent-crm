import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
          './components/**/*.{js,ts,jsx,tsx,mdx}',
              './app/**/*.{js,ts,jsx,tsx,mdx}',
                ],
                  theme: {
                      extend: {
                            backgroundImage: {
                                    'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                                            'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                                                  },
                                                        colors: {
                                                                brand: {
                                                                          50: '#FFF6FA',
                                                                                    100: '#FFEAF4',
                                                                                              200: '#FEDCEC',
                                                                                                        300: '#FDCEE1',
                                                                                                                  400: '#FDB8D7',
                                                                                                                            500: '#F58FC0',
                                                                                                                                      600: '#E066A3',
                                                                                                                                                700: '#C14380',
                                                                                                                                                          800: '#992F63',
                                                                                                                                                                    900: '#6E2247',
                                                                                                                                                                            },
                                                                                                                                                                                  },
                                                                                                                                                                                      },
                                                                                                                                                                                        },
                                                                                                                                                                                          plugins: [],
                                                                                                                                                                                          };
                                                                                                                                                                                          export default config;
                                                                                                                                                                                          