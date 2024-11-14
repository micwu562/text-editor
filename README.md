# hiccup

custom text editor for project

### prios

- [ ] proper copy-paste support
- [ ] undo history
- [ ] css reset; essential css stuff (font-smoothing, etc)

### support

#### `beforeinput`-based commands

https://w3c.github.io/input-events/#interface-InputEvent-Attributes

| inputType                        | status | notes                                       |
| -------------------------------- | ------ | ------------------------------------------- |
| insertText                       | `done` |                                             |
| ~~insertReplacementText~~        | `skip` | ex. from spellchecker                       |
| insertLineBreak                  | `done` | `shift` + `enter`                           |
| insertParagraph                  | `done` | `enter`                                     |
| ~~insertOrderedList~~            | `skip` | could support but keybind unknown           |
| ~~insertUnorderedList~~          | `skip` | could support but keybind unknown           |
| ~~insertHorizontalRule~~         | `skip` | could support but keybind unknown           |
| insertFromYank                   |        |                                             |
| insertFromDrop                   |        |                                             |
| insertFromPaste                  |        | implemented but `text/plain` only           |
| ~~insertFromPasteAsQuotation~~   | `skip` | could support but keybind unknown           |
| insertTranspose                  |        | `ctrl` + `t`; who tf uses this              |
| insertCompositionText            |        |                                             |
| insertLink                       |        |                                             |
| deleteWordBackward               | `done` | `option` + `del`                            |
| deleteWordForward                | `done` | `fn` + `option` + `del`                     |
| deleteSoftLineBackward           | `done` | `cmd` + `del` on chrome                     |
| deleteSoftLineForward            | `done` | `fn` + `cmd` + `del` on chrome              |
| deleteEntireSoftLine             |        |                                             |
| deleteHardLineBackward           |        | `cmd` + `del` on safari                     |
| deleteHardLineForward            |        | `fn` + `cmd` + `del` on safari              |
| deleteByDrag                     |        |                                             |
| deleteByCut                      | `done` | `cmd` + `x`                                 |
| deleteContent                    |        | word/line deletion when selection on safari |
| deleteContentBackward            | `done` | `del`                                       |
| deleteContentForward             | `done` | `fn` + `del`                                |
| historyUndo                      |        |                                             |
| historyRedo                      |        |                                             |
| formatBold                       |        |                                             |
| formatItalic                     |        |                                             |
| ~~formatUnderline~~              | `skip` |                                             |
| ~~formatStrikethrough~~          | `skip` | could support but keybind unknown           |
| ~~formatSuperscript~~            | `skip` |                                             |
| ~~formatSubscript~~              | `skip` |                                             |
| ~~formatJustifyFull~~            | `skip` |                                             |
| ~~formatJustifyCenter~~          | `skip` |                                             |
| ~~formatJustifyRight~~           | `skip` |                                             |
| ~~formatJustifyLeft~~            | `skip` |                                             |
| formatIndent                     |        |                                             |
| formatOutdent                    |        |                                             |
| ~~formatRemove~~                 | `skip` |                                             |
| ~~formatSetBlockTextDirection~~  | `skip` |                                             |
| ~~formatSetInlineTextDirection~~ | `skip` |                                             |
| ~~formatBackColor~~              | `skip` |                                             |
| ~~formatFontColor~~              | `skip` |                                             |
| ~~formatFontName~~               | `skip` |                                             |

#### additional commands

| inputType | status | notes |
| --------- | ------ | ----- |
| todo      | todo   | todo  |

### reading list

`https://unicode.org/reports/tr29`

- uax 19. specifies how word breaks are determined.
- not implemented, for my own sanity.

`https://www.unicode.org/reports/tr14`

- uax 14. specifies line breaking algorithm
- `@todo`: handle hyphen breaks, and maybe more?
