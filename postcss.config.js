import autoprefixer from 'autoprefixer';
import tailwindcss from '@tailwindcss/postcss';

const removeUnsupportedAtRules = () => ({
	postcssPlugin: 'remove-unsupported-at-rules',
	AtRule: {
		property(atRule) {
			atRule.remove();
		}
	}
});
removeUnsupportedAtRules.postcss = true;

export default {
	plugins: [removeUnsupportedAtRules(), tailwindcss(), autoprefixer]
};
