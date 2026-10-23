import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Сборка кладётся в build/ и использует относительные пути (как homepage: "./" в старом проекте),
// чтобы vk-hosting-config.json и deploy.yml остались без изменений.
export default defineConfig({
	base: './',
	plugins: [react()],
	server: {
		port: 10888,
		host: true,
		// Windows: запись файла идёт «обрезать, затем записать», и Vite успевал прочитать пустой файл (пустые модули и CSS до перезапуска).
		// Изменение принимается, когда размер файла перестал меняться
		watch: { awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 25 } },
	},
	build: {
		outDir: 'build',
		sourcemap: false,
		rolldownOptions: {
			output: {
				// Библиотеки в отдельных файлах: код приложения меняется при каждом выпуске, а они — редко, и остаются в кэше браузера
				codeSplitting: {
					groups: [
						{ name: 'react', test: /node_modules[\/](react|react-dom|scheduler)[\/]/, priority: 30 },
						{ name: 'vkui', test: /node_modules[\/]@vkontakte[\/](vkui|icons)[\/]/, priority: 20 },
						{ name: 'vendor', test: /node_modules[\/]/, priority: 10 },
					],
				},
			},
		},
	},
	test: { environment: 'jsdom' },
});
