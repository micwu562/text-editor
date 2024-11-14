# hiccup

custom text editor for project

### prios

- [ ] proper copy-paste support
- [ ] undo history
- [ ] css reset; essential css stuff (font-smoothing, etc)

### support

#### `beforeinput`-based commands

| inputType                        | done? | notes                             |
| -------------------------------- | ----- | --------------------------------- |
| insertText                       | `yes` |                                   |
| ~~insertReplacementText~~        |       | ex. from spellchecker             |
| insertLineBreak                  | `yes` | `shift`+`enter`                   |
| insertParagraph                  | `yes` | `enter`                           |
| ~~insertOrderedList~~            |       | could support but keybind unknown |
| ~~insertUnorderedList~~          |       | could support but keybind unknown |
| ~~insertHorizontalRule~~         |       | could support but keybind unknown |
| insertFromYank                   | `no`  |                                   |
| insertFromDrop                   | `no`  |                                   |
| insertFromPaste                  | `no`  | implemented but `text/plain` only |
| insertFromPasteAsQuotation       | `no`  |                                   |
| insertTranspose                  | `no`  |                                   |
| insertCompositionText            | `no`  |                                   |
| insertLink                       | `no`  |                                   |
| deleteWordBackward               | `yes` |                                   |
| deleteWordForward                | `yes` |                                   |
| deleteSoftLineBackward           | `yes` |                                   |
| deleteSoftLineForward            | `yes` |                                   |
| deleteEntireSoftLine             | `no`  |                                   |
| deleteHardLineBackward           | `no`  |                                   |
| deleteHardLineForward            | `no`  |                                   |
| deleteByDrag                     | `no`  |                                   |
| deleteByCut                      | `yes` |                                   |
| deleteContent                    | `no`  |                                   |
| deleteContentBackward            | `yes` |                                   |
| deleteContentForward             | `yes` |                                   |
| historyUndo                      | `no`  |                                   |
| historyRedo                      | `no`  |                                   |
| formatBold                       | `no`  |                                   |
| formatItalic                     | `no`  |                                   |
| ~~formatUnderline~~              |       |                                   |
| ~~formatStrikethrough~~          |       | could support but keybind unknown |
| ~~formatSuperscript~~            |       |                                   |
| ~~formatSubscript~~              |       |                                   |
| ~~formatJustifyFull~~            |       |                                   |
| ~~formatJustifyCenter~~          |       |                                   |
| ~~formatJustifyRight~~           |       |                                   |
| ~~formatJustifyLeft~~            |       |                                   |
| formatIndent                     | `no`  |                                   |
| formatOutdent                    | `no`  |                                   |
| ~~formatRemove~~                 |       |                                   |
| ~~formatSetBlockTextDirection~~  |       |                                   |
| ~~formatSetInlineTextDirection~~ |       |                                   |
| ~~formatBackColor~~              |       |                                   |
| ~~formatFontColor~~              |       |                                   |
| ~~formatFontName~~               |       |                                   |

#### additional commands

| inputType  | done? | notes |
| ---------- | ----- | ----- |
| insertText | yes   |       |

### reading list

`https://unicode.org/reports/tr29`

- uax 19. specifies how word breaks are determined.
- not implemented, for my own sanity.

`https://www.unicode.org/reports/tr14`

- uax 14. specifies line breaking algorithm
- `@todo`: handle hyphen breaks, and maybe more?
