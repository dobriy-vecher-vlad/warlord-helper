/* Подписи запросов к игре, которые считал клиент игры (перенесены из старого BotAPI). */

const utf8 = (text: string) => new TextEncoder().encode(text);

function base64(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

/**
 * Подпись результата боя (getFightHash): base64 от строки, к нему «Bd<1–9>rP», всё задом наперёд и снова base64.
 */
export function fightHash(key: string): string {
	const first = base64(utf8(key)) + 'Bd' + Math.ceil(9 * Math.random()) + 'rP';
	return base64(utf8([...first].reverse().join('')));
}

/** MD5 (hex) строки в UTF-8 — подпись улучшения зданий (getAcceptHash). */
export function md5(text: string): string {
	const bytes = utf8(text);
	const words: number[] = [];
	for (let i = 0; i < bytes.length; i++) words[i >> 2] = (words[i >> 2] ?? 0) | (bytes[i]! << ((i % 4) * 8));
	const bitLength = bytes.length * 8;
	words[bytes.length >> 2] = (words[bytes.length >> 2] ?? 0) | (0x80 << ((bytes.length % 4) * 8));
	words[(((bytes.length + 8) >> 6) + 1) * 16 - 2] = bitLength;
	const total = (((bytes.length + 8) >> 6) + 1) * 16;
	for (let i = 0; i < total; i++) words[i] = (words[i] ?? 0) | 0;

	const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
	const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0);
	let a0 = 0x67452301;
	let b0 = 0xefcdab89 | 0;
	let c0 = 0x98badcfe | 0;
	let d0 = 0x10325476;
	for (let chunk = 0; chunk < total; chunk += 16) {
		let [a, b, c, d] = [a0, b0, c0, d0];
		for (let i = 0; i < 64; i++) {
			let f: number;
			let g: number;
			if (i < 16) {
				f = (b & c) | (~b & d);
				g = i;
			} else if (i < 32) {
				f = (d & b) | (~d & c);
				g = (5 * i + 1) % 16;
			} else if (i < 48) {
				f = b ^ c ^ d;
				g = (3 * i + 5) % 16;
			} else {
				f = c ^ (b | ~d);
				g = (7 * i) % 16;
			}
			const shift = S[(i >> 4) * 4 + (i % 4)]!;
			const sum = (a + f + K[i]! + words[chunk + g]!) | 0;
			a = d;
			d = c;
			c = b;
			b = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
		}
		a0 = (a0 + a) | 0;
		b0 = (b0 + b) | 0;
		c0 = (c0 + c) | 0;
		d0 = (d0 + d) | 0;
	}
	return [a0, b0, c0, d0].map((word) => Array.from({ length: 4 }, (_, i) => ((word >>> (i * 8)) & 255).toString(16).padStart(2, '0')).join('')).join('');
}
