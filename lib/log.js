const MAX_ERRORS_SHOWN = 32

const logDisplay = () => {
	const el = document.createElement('div')
	el.style = `
        position: fixed;
        bottom: 16px;
        right: 16px;
        width: 20rem;
        max-height: 30rem;
		font-size: 0.6rem;
		white-space: pre-wrap;
    `

	// print errors to the log
	window.onerror = (msg, src, line, col) => {
		const msgEl = document.createElement('div')
		const trimmedSrc = src.split('/').slice(3).join('/')

		msgEl.textContent = `@${trimmedSrc}/${line}:${col}:\n${msg}`
		msgEl.style = `color: red`
		msgEl.onclick = () => {
			msgEl.remove()
		}

		if (el.childElementCount > MAX_ERRORS_SHOWN - 1) {
			el.removeChild(el.firstChild)
		}
		el.appendChild(msgEl)
	}

	// print logs to the log
	window.addEventListener('log', (e) => {
		const msgEl = document.createElement('div')

		msgEl.textContent = e.detail.message
		msgEl.onclick = () => {
			msgEl.remove()
		}

		if (el.childElementCount > MAX_ERRORS_SHOWN - 1) {
			el.removeChild(el.firstChild)
		}
		el.appendChild(msgEl)
	})

	return el
}

const log = (msg) => {
	const logEvt = new CustomEvent('log', {
		detail: {
			message: msg
		},
		bubbles: true
	})
	document.dispatchEvent(logEvt)
}

export { logDisplay, log }
