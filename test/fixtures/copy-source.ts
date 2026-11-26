function characters(...codepoints: number[]) {
	return String.fromCodePoint(...codepoints)
}

export interface CopyCase {
	/** Emoji sequences in order. Each inner list is one emoji's code points. */
	emoji: number[][]
	id: string
	/** Plain text the selection and the clipboard must each match. */
	source: string
}

/**
 * Public “A day of test notes” paragraphs from https://xat.sh/post/emoji-render-test
 * (section text captured 2026-11-25). The nine scalars are single code points with
 * no variation selector. The third case is the variation-selector regression.
 */
export const copyCases: CopyCase[] = [
	{
		emoji: [
			[0x2615],
			[0x1F4BB],
			[0x1F4DD],
			[0x1F50D],
			[0x1F9E9],
			[0x1F4E6],
		],
		id: 'day-notes-p1',
		source: `In the morning, I make a cup of coffee ${characters(0x2615)}, open the laptop ${characters(0x1F4BB)}, and jot down a small checklist ${characters(0x1F4DD)}. I picture the flow as a light patrol: inspect the content pipeline with a magnifying glass ${characters(0x1F50D)}, fit one small puzzle piece ${characters(0x1F9E9)}, then put the suspicious edges back in the box ${characters(0x1F4E6)}.`,
	},
	{
		emoji: [
			[0x1F642],
			[0x1F44D],
			[0x2705],
		],
		id: 'day-notes-p2',
		source: `The mood while wiring the config is roughly this: when the plugin mounts, I smile ${characters(0x1F642)}; when the first emoji turns into Fluent style, I want to give it a thumbs up ${characters(0x1F44D)}; and when CSS does not stretch it into a giant article image, I can safely say: good, today was not wasted ${characters(0x2705)}.`,
	},
	{
		emoji: [[0x1F6E0, 0xFE0F]],
		id: 'variation-selector',
		source: characters(0x1F6E0, 0xFE0F),
	},
]
