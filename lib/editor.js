import { log } from './log.js'

// one file - oh yeah

// char grid dimensions
const _CH_W = 8
const _CH_H = 20

const editor = () => {
	// (')> - state

	// lines
	const data = []

	// flow data
	let rowStarts = []

	// selection
	let cursor = 0
	let preferredCursorC = null
	let selectionStart = null

	let cursorR = 0
	let cursorC = 0

	let mouseDown = false

	// draw data
	let lastAction = 0

	// (')> - editor commands

	/**
	 * inserts text
	 * @param {string} text text to insert
	 * @param {number} pos position to insert at
	 * @returns {number} end position
	 */
	const _insertText = (text, pos) => {
		for (let i = 0; i < text.length; i++) {
			const ch = {
				ch: text.charAt(i)
			}
			data.splice(pos, 0, ch)
			pos += 1
		}
		return pos
	}

	/**
	 * inserts text at current cursor pos
	 * @todo handle selections.
	 * @param {string} text text to insert
	 */
	const _insertAtCursor = (text) => {
		cursor = _insertText(text, cursor)
	}

	/**
	 *
	 * @param {number} row
	 * @param {number} col
	 */
	const _nearestChar = (row, col) => {
		if (row < 0) return 0
		if (row > rowStarts.length - 2) return data.length
		let p = rowStarts[row] + col
		return Math.min(p, rowStarts[row + 1].length - 1)
	}

	/**
	 * simulates a backspace
	 */
	const _deleteAtCursor = () => {
		if (data.length > 0) {
			cursor -= 1
			data.splice(cursor, 1)
		}
	}

	/**
	 *
	 * @param {'up' | 'down' | 'left' | 'right'} dir
	 * @param {'word' | 'line' | 'char'} by
	 * @param {boolean} select
	 */
	const _moveCursor = (dir, by = 'char', select = false) => {
		if (select) {
			if (selectionStart === null) {
				selectionStart = cursor
			}
		} else {
			selectionStart = null
		}

		switch (dir) {
			case 'left': {
				if (cursor > 0) {
					cursor -= 1
					preferredCursorC = null
				}
				break
			}
			case 'right': {
				if (cursor < data.length) {
					cursor += 1
					preferredCursorC = null
				}
				break
			}
			case 'up': {
				if (cursorR > 0) {
					if (preferredCursorC === null) {
						preferredCursorC = cursorC
					}
					// we try to match column, but can't if row is too short.
					let newCursor = rowStarts[cursorR - 1] + preferredCursorC
					cursor = Math.min(newCursor, rowStarts[cursorR] - 1)
				} else {
					cursor = 0
				}
				break
			}
			case 'down': {
				if (cursorR < rowStarts.length - 2) {
					if (preferredCursorC === null) {
						preferredCursorC = cursorC
					}
					// we try to match column, but can't if row is too short.
					let newCursor = rowStarts[cursorR + 1] + preferredCursorC
					cursor = Math.min(newCursor, rowStarts[cursorR + 2] - 1) // why no -1???
				} else {
					cursor = data.length
				}
				break
			}
		}
	}

	const run = (command, data) => {
		switch (command) {
			case 'insertText': {
				/** @todo - can insertText insert multiple chars? */
				_insertAtCursor(data.data)
				preferredCursorC = null
				break
			}
			case 'insertParagraph':
			case 'insertLineBreak': {
				_insertAtCursor('\n')
				preferredCursorC = null
				break
			}
			case 'deleteContentBackward': {
				_deleteAtCursor()
				break
			}
			case 'move': {
				/** @todo windows has diff setup */
				const select = data.shift
				const by = data.cmd ? 'line' : data.alt ? 'word' : 'char'
				_moveCursor(data.dir, by, select)
				break
			}
			default: {
				throw new Error(`command ${command} not implemented`)
			}
		}

		// record that we just did something (for cursor animation)
		lastAction = document.timeline.currentTime

		// redraw?
		reflow()
		// draw()
	}

	/**
	 * calculates where characters should be on the screen, based on word wrap, etc.
	 * @param {number} start the start position (UNUSED)
	 */
	const reflow = (start) => {
		/** @improvement start from the character */
		let r = 0
		let c = 0
		let lastSpace = -1
		const _rowStarts = [0]

		for (let pos = 0; pos < data.length; pos += 1) {
			const ch = data[pos]
			ch.r = r
			ch.c = c

			if (ch.ch === '\n') {
				// if \n, place and move cursor. \n's don't cause word wrap.
				r += 1
				c = 0
				_rowStarts.push(pos + 1) // iffy
			} else if (c >= 50) {
				// word wrap. relocate all chars in the word.
				r += 1
				c = 0
				// if the overflowing word spans the entire line...
				if (lastSpace === -1 || data[lastSpace].r !== r - 1) {
					data[pos].r = r
					data[pos].c = c
					c += 1
					_rowStarts.push(pos)
				} else {
					for (let p = lastSpace + 1; p <= pos; p++) {
						data[p].r = r
						data[p].c = c
						c += 1
					}
					_rowStarts.push(lastSpace + 1)
				}
			} else {
				// no overflow - proceed as normal
				c += 1
			}

			if (/\s/.test(ch.ch)) {
				lastSpace = pos
			}
		}

		// update rowStarts
		_rowStarts.push(data.length + 1)
		rowStarts = _rowStarts

		// cursor position
		if (cursor === data.length) {
			cursorR = r
			cursorC = c
		} else {
			cursorR = data[cursor].r
			cursorC = data[cursor].c
		}
	}

	// (')> - dom setup

	const el = document.createElement('div')

	const display = document.createElement('canvas')
	const dpr = window.devicePixelRatio || 1
	const ctx = display.getContext('2d')

	display.height = 400 * dpr
	display.width = 408 * dpr
	display.style = `
		display: block;
		border: 1px solid blue;
		height: 400px;
		width: 408px;
	`
	ctx.scale(dpr, dpr)

	const inputcap = document.createElement('div')
	inputcap.contentEditable = true
	inputcap.autofocus = true
	inputcap.style = `
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		color: transparent;
	`

	inputcap.addEventListener('mousedown', (e) => {
		mouseDown = true
	})
	window.addEventListener('mousemove', (e) => {
		// ...
	})

	window.addEventListener('mouseup', (e) => {
		if (mouseDown) {
			mouseDown = false
			// ...
		}
	})

	inputcap.addEventListener('keydown', (e) => {
		const modifiers = {
			shift: e.shiftKey,
			alt: e.altKey,
			cmd: e.metaKey,
			ctrl: e.ctrlKey
		}
		const actions = {
			ArrowLeft: () => run('move', { dir: 'left', ...modifiers }),
			ArrowRight: () => run('move', { dir: 'right', ...modifiers }),
			ArrowUp: () => run('move', { dir: 'up', ...modifiers }),
			ArrowDown: () => run('move', { dir: 'down', ...modifiers })
		}

		if (e.code in actions) {
			actions[e.code]()
			e.preventDefault()
		} else {
			// ...
		}
	})

	// https://w3c.github.io/input-events/#interface-InputEvent-Attributes
	inputcap.addEventListener('beforeinput', (e) => {
		log(e.inputType)
		run(e.inputType, {
			data: e.data,
			dataTransfer: e.dataTransfer,
			isComposing: e.isComposing
		})
		e.preventDefault()
	})

	el.style = `
		width: 408px;
		position: relative;
		margin-x: auto;
	`

	el.appendChild(inputcap)
	el.appendChild(display)

	// (')> - rendering

	const draw = (timestamp) => {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		ctx.fillStyle = 'black'
		ctx.font = '12px SF Mono'

		// draw chars
		for (const ch of data) {
			ctx.fillText(ch.ch, ch.c * _CH_W, (ch.r + 1) * _CH_H)
		}

		// draw cursor
		if ((timestamp - lastAction) % 1000 < 500) {
			ctx.fillRect(cursorC * _CH_W, (cursorR + 0.25) * _CH_H, 1, _CH_H)
		}
	}

	const keepDrawing = (timestamp) => {
		draw(timestamp)
		requestAnimationFrame(keepDrawing)
	}

	keepDrawing()

	//

	return el
}

//

export { editor }