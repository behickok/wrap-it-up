/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {}
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: false, // We'll use custom CSS variables
		darkTheme: false,
		base: true,
		styled: true,
		utils: true
	}
};
