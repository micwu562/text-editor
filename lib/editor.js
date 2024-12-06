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
	let hardStarts = []
	let hardLineRs = [] // NOT ACTUALLY HARD LINE

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
	const _insertText = (text, pos) => {
		for (let i = 0; i < text.length; i++) {
			const ch = { ch: text.charAt(i), new: true, ok: false }
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
		_deleteSel()
		cursor = _insertText(text, cursor)
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
	 * gets the current selection bounds, in order.
	 * @returns {[number, number]} lower bound, upper bound
	 */
	const _sel = () => {
		const lo = Math.min(cursor, selectionStart)
		const hi = Math.max(cursor, selectionStart)
		return [lo, hi]
	}

	/**
	 * checks if selection is collapsed.
	 * @returns {boolean} if the selection is collapsed
	 */
	const _selCollapsed = () => {
		return cursor === selectionStart
	}

	/**
	 * deletes current selection.
	 * @returns {any[]} deleted chars
	 */
	const _deleteSel = () => {
		const [lo, hi] = _sel()
		cursor = lo
		selectionStart = lo
		return data.splice(lo, hi - lo)
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
			(dir === 'back' && pos >= 0)
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

		// pos can be -1 when searching backward
		return Math.max(pos, 0)
	}

	/**
	 * simulates a backspace
	 * @param {'forward' | 'back'} dir direction
	 * @param {'word' | 'line' | 'char'} by amount to delete by
	 */
	const _deleteAtCursor = (dir, by) => {
		// to delete a word: select the word, then delete selection. if
		// selection already exists, we don't move; we delete current sel
		if (_selCollapsed()) {
			const cdir = dir === 'forward' ? 'right' : 'left'
			_moveCursor(cdir, by, true)
		}
		_deleteSel()
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
						cursor = _sel()[0]
					} else {
						cursor = _nextWordBoundary(cursor, 'back')
					}
				} else {
					if (dropsSel) {
						cursor = _sel()[0]
					} else if (cursor > 0) {
						cursor -= 1
					}
					preferredCursorC = null
				}
				break
			}
			case 'right': {
				if (by === 'line') {
					cursor = _nearestChar(cursorR, _LINE_CHARS + 1)
					preferredCursorC = null
				} else if (by === 'word') {
					if (dropsSel) {
						cursor = _sel()[1]
					} else {
						cursor = _nextWordBoundary(cursor, 'forward')
					}
				} else {
					if (dropsSel) {
						cursor = _sel()[1]
					} else if (cursor < data.length) {
						cursor += 1
					}
					preferredCursorC = null
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
			case 'insertFromPaste': {
				/** @todo improve clipboard support */
				const text = cdata.dataTransfer.getData('text/plain')
				_insertAtCursor(text)
				break
			}
			case 'insertTranspose': {
				if (data.length > 1) {
					if (cursor === data.length) {
						const tmp = data[cursor - 2]
						data[cursor - 2] = data[cursor - 1]
						data[cursor - 1] = tmp
					} else {
						const tmp = data[cursor - 1]
						data[cursor - 1] = data[cursor]
						data[cursor] = tmp
						_moveCursor('right')
					}
				}
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
			case 'formatBold': {
				/** @todo handle unbolding */
				// const [lo, hi] = _sel()
				// _insertText('**', hi)
				// _insertText('**', lo)
				// cursor += 2
				// selectionStart += 2
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
		let l = 0
		let lc = 0
		let lastSpace = -1
		const _softStarts = [0]
		const _hardStarts = [0]
		const _hardLineRs = [0]

		for (let pos = 0; pos < data.length; pos += 1) {
			const ch = data[pos]
			ch.r = r
			ch.c = c
			ch.l = l
			ch.lc = lc

			lc += 1

			if (ch.ch === '\n') {
				// if \n, place and move cursor. \n's don't cause word wrap.
				r += 1
				c = 0
				l += 1
				lc = 0
				_softStarts.push(pos + 1) // iffy
				_hardStarts.push(pos + 1)
				_hardLineRs.push(r)
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
					l += 1
					lc = 0
					_hardStarts.push(pos)
					_hardLineRs.push(r)
					for (let p = lastSpace + 1; p <= pos; p++) {
						data[p].r = r
						data[p].c = c
						data[p].l = l
						data[p].lc = lc
						c += 1
						lc += 1
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

		// update softStarts and hardStarts
		_softStarts.push(data.length + 1)
		_hardStarts.push(data.length + 1)
		_hardLineRs.push(r + 1) // ?
		softStarts = _softStarts
		hardStarts = _hardStarts
		hardLineRs = _hardLineRs

		// cursor position
		if (cursor === data.length) {
			cursorR = r
			cursorC = c
		} else {
			cursorR = data[cursor].r
			cursorC = data[cursor].c
		}

		// for safari
		// evts such as deleteContentBackward don't fire if there is no text
		// to delete. need to fill div w/ editable text so they can fire.
		/** @todo does this go here?? */
		inputcap.textContent = 'abcdefgh'
		const range = document.createRange()
		const sel = window.getSelection()
		range.setStart(inputcap.childNodes[0], 4)
		if (cursor !== selectionStart) {
			range.setEnd(inputcap.childNodes[0], 6)
		}
		sel.removeAllRanges()
		sel.addRange(range)
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
	// note: safari blocks locally installed fonts for privacy
	ctx.font = '12px "SF Mono", monospace'
	ctx.textBaseline = 'top'
	ctx.textAlign = 'left'

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

	let prevt = null
	let cpr = 0
	let cpc = 0

	const draw = (timestamp) => {
		// init
		if (prevt === null) prevt = timestamp - 1
		const dt = timestamp - prevt

		const rStart = performance.now()

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		// selection
		const selStart = Math.min(selectionStart, cursor)
		const selEnd = Math.max(selectionStart, cursor)

		// draw chars (and selection)
		for (let i = 0; i < data.length; i++) {
			const ch = data[i]

			const lr = hardLineRs[ch.l]
			const lc = ch.c + _LINE_CHARS * (ch.r - lr)
			if (!('plr' in ch)) ch.plr = lr
			if (!('plc' in ch)) ch.plc = lc
			/** @todo move lerp to function */
			ch.plc = lc - (lc - ch.plc) * Math.exp(-dt / 40)
			ch.plr = lr - (lr - ch.plr) * Math.exp(-dt / 40)
			ch.pr = ch.plr + Math.floor(ch.plc / _LINE_CHARS)
			ch.pc = ch.plc % _LINE_CHARS

			if (Math.abs(ch.plc - lc) > 0.3 || Math.abs(ch.plr - lr) > 0.3) {
				ch.ok = false
			} else {
				ch.ok = true
			}

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

			if (ch.new) {
				if (i !== 0 && !data[i - 1].ok) {
					continue // tmp
				} else {
					ch.t = timestamp
					ch.new = false
				}
			}

			const age = (timestamp - ch.t) / 1000
			const dy = 30 * Math.sin(10 * age + 10) * age * Math.exp(-10 * age)

			ctx.fillText(
				ch.ch,
				_P + ch.pc * _CH_W,
				_P + ch.pr * _CH_H * _LN_H + (_LN_H - 1) * 0.5 * _CH_H + dy
			)
			// for chars that are sliding past the edge, we need to draw them twice.
			if (ch.pc > _LINE_CHARS - 1) {
				ctx.fillText(
					ch.ch,
					_P + (((ch.pc + 1) % _LINE_CHARS) - 1) * _CH_W,
					_P + (ch.pr + 1) * _CH_H * _LN_H + (_LN_H - 1) * 0.5 * _CH_H + dy
				)
			}
		}

		// draw cursor
		if (isNaN(cpr)) cpr = 0
		if (isNaN(cpc)) cpc = 0
		cpr = cursorR - (cursorR - cpr) * Math.exp(-dt / 20)
		cpc = cursorC - (cursorC - cpc) * Math.exp(-dt / 20)
		if ((timestamp - lastAction) % 1000 < 500) {
			ctx.fillRect(
				_P + cpc * _CH_W,
				_P + cpr * _CH_H * _LN_H - 1,
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

		prevt = timestamp
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
