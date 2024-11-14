import { log } from './log.js'

// one file - oh yeah

// max line width
const _LINE_CHARS = 50

// char render dimensions (width, height, line height, padding)
const _CH_W = 8
const _CH_H = 12
const _LN_H = 1.5
const _P = 4

const editor = () => {
	// (')> - state

	// lines
	const data = []

	// flow data
	let softStarts = []

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
			const ch = { ch: text.charAt(i) }
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
		if (row > softStarts.length - 2) return data.length
		let p = softStarts[row] + Math.max(0, col)
		return Math.min(p, softStarts[row + 1] - 1)
	}

	/**
	 * looks ahead or backward until a word boundary is found.
	 * boundary defined as change btwn groups [\w, \s, other]
	 * @todo improve boundary rules if necessary.
	 * @param {number} pos start position
	 * @param {'forward' | 'back'} dir direction to look
	 * @returns {number} position of word boundary
	 */
	const _nextWordBoundary = (pos, dir) => {
		const di = dir === 'forward' ? 1 : -1
		let wsOver = false
		let prevIsWord = null

		// when moving backword, correct cursor pos is +1
		const offset = dir === 'forward' ? 0 : 1
		// start searching from one space back if backward
		if (dir === 'back') {
			pos -= 1
		}

		while (
			(dir === 'forward' && pos < data.length) ||
			(dir === 'back' && pos > 0)
		) {
			const ch = data[pos].ch
			if (!/\s/.test(ch)) {
				wsOver = true
			}
			if (wsOver) {
				if (/\s/.test(ch)) {
					return pos + offset
				}
				const isWord = /\w/.test(ch)
				if (prevIsWord !== null && prevIsWord != isWord) {
					return pos + offset
				}
				prevIsWord = isWord
			}
			pos += di
		}

		// pos is -1 if searching backward from 0 (oops)
		return Math.max(pos, 0)
	}

	/**
	 * simulates a backspace
	 * @param {'forward' | 'back'} dir direction
	 * @param {'word' | 'line' | 'char'} by amount to delete by
	 */
	const _deleteAtCursor = (dir, by) => {
		if (selectionStart !== cursor) {
			_insertAtCursor('') // lol
		} else {
			const old = cursor
			if (dir === 'back') {
				_moveCursor('left', by)
				data.splice(cursor, old - cursor)
			} else {
				/** @todo ugly code - consider changing _moveCursor to return a new pos */
				_moveCursor('right', by)
				data.splice(old, cursor - old)
				cursor = old // bad
			}
			selectionStart = cursor
		}
	}

	/**
	 * moves the cursor in a given direction
	 * @todo should return a new cursor, instead of modifying directly.
	 * @param {'up' | 'down' | 'left' | 'right'} dir direction to move
	 * @param {'word' | 'line' | 'char'} by amount to jump by
	 * @param {boolean} select whether this counts as a selection
	 */
	const _moveCursor = (dir, by = 'char', select = false) => {
		// when a word motion drops existing selection, we don't actually
		// move by word; we just go to corresponding endpoint of selection
		const dropsSel = !select && selectionStart !== cursor

		switch (dir) {
			case 'left': {
				if (by === 'line') {
					cursor = _nearestChar(cursorR, 0)
					preferredCursorC = null
				} else if (by === 'word') {
					if (dropsSel) {
						cursor = Math.min(selectionStart, cursor)
					} else {
						cursor = _nextWordBoundary(cursor, 'back')
					}
				} else {
					if (cursor > 0) {
						cursor -= 1
						preferredCursorC = null
					}
				}
				break
			}
			case 'right': {
				if (by === 'line') {
					cursor = _nearestChar(cursorR, _LINE_CHARS + 1)
					preferredCursorC = null
				} else if (by === 'word') {
					if (dropsSel) {
						cursor = Math.max(selectionStart, cursor)
					} else {
						cursor = _nextWordBoundary(cursor, 'forward')
					}
				} else {
					if (cursor < data.length) {
						cursor += 1
						preferredCursorC = null
					}
				}
				break
			}
			case 'up': {
				if (!select && selectionStart !== cursor) {
					cursor = Math.min(selectionStart, cursor)
				} else if (by === 'line') {
					cursor = 0
					preferredCursorC = null
				} else if (by === 'word') {
					/** @todo */
					// option + up moves to hard line starts.
					// if dropsSel, go to nearest one from selection point
				} else {
					if (cursorR > 0) {
						if (preferredCursorC === null) {
							preferredCursorC = cursorC
						}
						// we try to match column, but can't if row is too short.
						let newCursor = softStarts[cursorR - 1] + preferredCursorC
						cursor = Math.min(newCursor, softStarts[cursorR] - 1)
					} else {
						cursor = 0
					}
				}
				break
			}
			case 'down': {
				if (!select && selectionStart !== cursor) {
					cursor = Math.max(selectionStart, cursor)
				} else if (by === 'line') {
					cursor = data.length
					preferredCursorC = null
				} else if (by === 'word') {
					// oh boy...
					// (move the line)
				} else {
					if (cursorR < softStarts.length - 2) {
						if (preferredCursorC === null) {
							preferredCursorC = cursorC
						}
						// we try to match column, but can't if row is too short.
						let newCursor = softStarts[cursorR + 1] + preferredCursorC
						cursor = Math.min(newCursor, softStarts[cursorR + 2] - 1) // why no -1???
					} else {
						cursor = data.length
					}
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
	 * @param {*} cdata
	 */
	const run = (command, cdata) => {
		switch (command) {
			case 'insertText': {
				_insertAtCursor(cdata.data)
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
				_deleteAtCursor('back', 'char')
				break
			}
			case 'deleteContentForward': {
				_deleteAtCursor('forward', 'char')
				break
			}
			case 'deleteWordBackward': {
				_deleteAtCursor('back', 'word')
				break
			}
			case 'deleteWordForward': {
				_deleteAtCursor('forward', 'word')
				break
			}
			case 'deleteSoftLineBackward': {
				_deleteAtCursor('back', 'line')
				break
			}
			case 'deleteSoftLineForward': {
				_deleteAtCursor('forward', 'line')
				break
			}
			case 'insertFromPaste': {
				/** @todo improve clipboard support */
				const text = cdata.dataTransfer.getData('text/plain')
				_insertAtCursor(text)
				break
			}
			case 'moveFromClick': {
				const { left, top } = display.getBoundingClientRect()
				const { clientX: x, clientY: y, select } = cdata
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
				const select = cdata.shift
				const by = cdata.cmd ? 'line' : cdata.alt ? 'word' : 'char'
				_moveCursor(cdata.dir, by, select)
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
		const _softStarts = [0]

		for (let pos = 0; pos < data.length; pos += 1) {
			const ch = data[pos]
			ch.r = r
			ch.c = c

			if (ch.ch === '\n') {
				// if \n, place and move cursor. \n's don't cause word wrap.
				r += 1
				c = 0
				_softStarts.push(pos + 1) // iffy
			} else if (c >= _LINE_CHARS) {
				// word wrap. relocate all chars in the word.
				r += 1
				c = 0
				// if the overflowing word spans the entire line...
				if (lastSpace === -1 || data[lastSpace].r !== r - 1) {
					data[pos].r = r
					data[pos].c = c
					c += 1
					_softStarts.push(pos)
				} else {
					for (let p = lastSpace + 1; p <= pos; p++) {
						data[p].r = r
						data[p].c = c
						c += 1
					}
					_softStarts.push(lastSpace + 1)
				}
			} else {
				// no overflow - proceed as normal
				c += 1
			}

			if (/\s/.test(ch.ch)) {
				lastSpace = pos
			}
		}

		// update softStarts
		_softStarts.push(data.length + 1)
		softStarts = _softStarts

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
	inputcap.spellcheck = false
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
		}
	})

	inputcap.addEventListener('copy', (e) => {
		log('copy')
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

		// for safari
		// evts such as deleteContentBackward don't fire if there is no text
		// to delete. need to fill div w/ editable text so they can fire.
		e.target.textContent = 'abcdefgh'
		const range = document.createRange()
		const sel = window.getSelection()
		range.setStart(e.target.childNodes[0], 4)
		range.setEnd(e.target.childNodes[0], 6)
		sel.removeAllRanges()
		sel.addRange(range)
	})

	el.style = `
		width: 408px;
		position: relative;
		margin-x: auto;
	`

	el.appendChild(inputcap)
	el.appendChild(display)

	// (')> - rendering

	// (temporary) fps vars
	const mspfs = Array(120).fill(0)
	let mspfn = 0

	const draw = (timestamp) => {
		const rStart = performance.now()

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		// note: safari blocks locally installed fonts for privacy
		ctx.font = '12px "SF Mono", monospace'
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

		// mspf display
		mspfs[mspfn] = performance.now() - rStart
		mspfn = (mspfn + 1) % mspfs.length
		let mspfSum = 0
		for (const v of mspfs) {
			mspfSum += v
		}

		ctx.textAlign = 'right'
		ctx.fillStyle = '#00f8'

		for (let n = 0; n < mspfs.length; n++) {
			const i = (n + mspfn) % mspfs.length
			const h = (mspfs[i] / 4.0) * 40
			ctx.fillRect(
				ctx.canvas.width / dpr - _P - mspfs.length + n,
				ctx.canvas.height / dpr - _P - h - _CH_H * _LN_H,
				1,
				h
			)
		}
		ctx.fillText(
			`${(mspfSum / mspfs.length).toLocaleString('en-us', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			})}/4.00`,
			ctx.canvas.width / dpr - _P,
			ctx.canvas.height / dpr - _CH_H - _P
		)
		ctx.textAlign = 'left'
		ctx.fillStyle = 'black'

		//
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
