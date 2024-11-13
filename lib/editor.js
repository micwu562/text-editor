import { log } from './log.js'

// one file - oh yeah

// max line width
const _MAX_LINE_CHARS = 50

// char render dimensions
const _CH_W = 8
const _CH_H = 12
const _LN_H = 1.5
const _P = 4

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
	 * @param {number} del characters to delete
	 * @returns {number} end position
	 */
	const _insertText = (text, pos, del = 0) => {
		data.splice(pos, del)
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
	 * @param {string} text text to insert
	 */
	const _insertAtCursor = (text) => {
		const pos = Math.min(selectionStart, cursor)
		const del = Math.max(selectionStart, cursor) - pos
		cursor = _insertText(text, pos, del)
		selectionStart = cursor
	}

	/**
	 * gets nearest char to a position (row, col)
	 * @param {number} row
	 * @param {number} col
	 */
	const _nearestChar = (row, col) => {
		if (row < 0) return 0
		if (row > rowStarts.length - 2) return data.length
		let p = rowStarts[row] + Math.max(0, col)
		return Math.min(p, rowStarts[row + 1] - 1)
	}

	/**
	 * simulates a backspace
	 */
	const _deleteAtCursor = () => {
		if (selectionStart !== cursor) {
			_insertAtCursor('') // lol
		} else {
			const old = cursor
			_moveCursor('left')
			if (cursor !== old) {
				data.splice(cursor, 1)
			}
		}
	}

	/**
	 * moves the cursor in a given direction
	 * @param {'up' | 'down' | 'left' | 'right'} dir direction to move
	 * @param {'word' | 'line' | 'char'} by amount to jump by
	 * @param {boolean} select whether this counts as a selection
	 */
	const _moveCursor = (dir, by = 'char', select = false) => {
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

		if (!select) {
			selectionStart = cursor
		}
	}

	/**
	 * takes input commands and executes them.
	 * commands come from beforeinput, keydown, and mouse events.
	 * @param {string} command
	 * @param {*} data
	 */
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
			case 'moveFromClick': {
				const { left, top } = display.getBoundingClientRect()
				const { clientX: x, clientY: y, select } = data
				const newR = Math.floor((y - top - _P) / (_CH_H * _LN_H))
				const newC = Math.floor((x - left - _P) / _CH_W + 0.5)
				cursor = _nearestChar(newR, newC)
				if (!select) {
					preferredCursorC = null
					selectionStart = cursor
				}
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
	}

	/**
	 * calculates where characters should be on the screen, based on word wrap, etc.
	 * @param {number} start the position to start reflowing from (UNUSED)
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
			} else if (c >= _MAX_LINE_CHARS) {
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
		run('moveFromClick', {
			clientX: e.clientX,
			clientY: e.clientY,
			select: false
		})
	})
	window.addEventListener('mousemove', (e) => {
		if (mouseDown) {
			run('moveFromClick', {
				clientX: e.clientX,
				clientY: e.clientY,
				select: true
			})
		}
	})

	window.addEventListener('mouseup', () => {
		mouseDown = false
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

	const FREQ = 1000
	let lastTimestamp = 0
	let fpsCtr = 0
	let fpsSum = 0
	let fpsD = 0

	const draw = (timestamp) => {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		ctx.font = '12px SF Mono'
		ctx.textBaseline = 'top'
		ctx.textAlign = 'left'

		// selection
		const selStart = Math.min(selectionStart, cursor)
		const selEnd = Math.max(selectionStart, cursor)

		// draw chars (and selection)
		for (let i = 0; i < data.length; i++) {
			const ch = data[i]
			if (i >= selStart && i < selEnd) {
				ctx.fillStyle = '#ccc'
				ctx.fillRect(
					_P + ch.c * _CH_W,
					_P + ch.r * _CH_H * _LN_H - 1,
					_CH_W,
					_CH_H * _LN_H
				)
				ctx.fillStyle = 'black'
			}
			ctx.fillText(
				ch.ch,
				_P + ch.c * _CH_W,
				_P + ch.r * _CH_H * _LN_H + (_LN_H - 1) * 0.5 * _CH_H
			)
		}

		// draw cursor
		if ((timestamp - lastAction) % 1000 < 500) {
			ctx.fillRect(
				_P + cursorC * _CH_W,
				_P + cursorR * _CH_H * _LN_H - 1,
				1,
				_CH_H * _LN_H
			)
		}

		// fps counter
		if (timestamp && lastTimestamp) {
			fpsSum += timestamp - lastTimestamp
			fpsCtr += 1
		}
		if (fpsSum > FREQ) {
			fpsD = fpsSum / fpsCtr
			fpsSum = 0
			fpsCtr = 0
		}
		if (fpsD !== 0) {
			ctx.fillText(Math.floor((1000 / fpsD) * 10) / 10, 0, 200)
		}
		lastTimestamp = timestamp
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
