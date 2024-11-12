import { editor } from './lib/editor.js'
import { logDisplay } from './lib/log.js'

const editorEl = editor()

document.body.appendChild(logDisplay())
document.body.appendChild(editorEl)
