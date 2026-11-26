import type { AddressInfo } from 'node:net'

import { createServer } from 'node:http'

import { expect, test } from '@playwright/test'
import emojiRegex from 'emoji-regex-xs'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'
import { unified } from 'unified'

import { rehypeFluentEmoji } from '../src/plugin.js'
import { copyCases } from './fixtures/copy-source.js'

function codepoints(value: string) {
	return [...value].map(character => character.codePointAt(0)!)
}

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
}

async function renderDocument(html: string) {
	const file = await unified()
		.use(rehypeParse)
		.use(rehypeFluentEmoji)
		.use(rehypeStringify)
		.process(html)

	return String(file)
}

function serve(html: string) {
	const server = createServer((_request, response) => {
		response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
		response.end(html)
	})

	return new Promise<{ close: () => Promise<void>, url: string }>((resolve) => {
		server.listen(0, '127.0.0.1', () => {
			const address = server.address() as AddressInfo
			resolve({
				close: () => new Promise((done, reject) => {
					server.close(error => error ? reject(error) : done())
				}),
				url: `http://127.0.0.1:${address.port}/`,
			})
		})
	})
}

let closeServer: (() => Promise<void>) | undefined
let fixtureUrl = ''

test.beforeAll(async () => {
	for (const item of copyCases) {
		const sequences = [...item.source.matchAll(emojiRegex())].map(match => codepoints(match[0]))
		expect(sequences).toEqual(item.emoji)
	}

	const body = copyCases
		.map(item => `<p data-case="${item.id}">${escapeHtml(item.source)}</p>`)
		.join('')
	const html = await renderDocument(`<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`)
	const server = await serve(html)
	closeServer = server.close
	fixtureUrl = server.url
})

test.afterAll(async () => {
	await closeServer?.()
})

for (const item of copyCases) {
	test(`${item.id} keeps unicode in the selection and on the clipboard`, async ({ page }) => {
		if (!fixtureUrl)
			throw new Error('fixture server did not start')

		await page.goto(fixtureUrl)
		await page.locator('body').click()

		// A failed copy must not leave the previous case's text looking like success.
		await page.evaluate(async () => {
			await navigator.clipboard.writeText('__SENTINEL__')
		})

		const selection = await page.evaluate((id) => {
			const element = document.querySelector(`[data-case="${id}"]`)
			if (!(element instanceof HTMLElement))
				throw new Error(`missing case ${id}`)

			const range = document.createRange()
			range.selectNodeContents(element)
			const selected = window.getSelection()
			if (!selected)
				throw new Error('window.getSelection() returned null')

			selected.removeAllRanges()
			selected.addRange(range)
			return selected.toString()
		}, item.id)

		// Selection text is not evidence for the clipboard. Read them separately.
		expect(selection).toBe(item.source)
		expect(codepoints(selection)).toEqual(codepoints(item.source))

		await page.keyboard.press('Control+C')

		await expect.poll(async () => page.evaluate(async () => navigator.clipboard.readText())).toBe(item.source)

		const clipboard = await page.evaluate(async () => navigator.clipboard.readText())
		expect(clipboard).not.toBe('__SENTINEL__')
		expect(codepoints(clipboard)).toEqual(codepoints(item.source))

		const layers = await page.locator(`[data-case="${item.id}"] .fluent-emoji-text`).allTextContents()
		expect(layers.map(layer => codepoints(layer))).toEqual(item.emoji)
	})
}
