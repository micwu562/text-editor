# hiccup

custom text editor for project

### prios

- [ ] proper copy-paste support
- [ ] undo history
- [ ] css reset; essential css stuff (font-smoothing, etc)

### support

#### `beforeinput`-based commands

| inputType                        | status | notes                             |
| -------------------------------- | ------ | --------------------------------- |
| insertText                       | `yes`  |                                   |
| ~~insertReplacementText~~        |        | ex. from spellchecker             |
| insertLineBreak                  | `yes`  | `shift`+`enter`                   |
| insertParagraph                  | `yes`  | `enter`                           |
| ~~insertOrderedList~~            | `skip` | could support but keybind unknown |
| ~~insertUnorderedList~~          | `skip` | could support but keybind unknown |
| ~~insertHorizontalRule~~         | `skip` | could support but keybind unknown |
| insertFromYank                   |        |                                   |
| insertFromDrop                   |        |                                   |
| insertFromPaste                  |        | implemented but `text/plain` only |
| insertFromPasteAsQuotation       |        |                                   |
| insertTranspose                  |        |                                   |
| insertCompositionText            |        |                                   |
| insertLink                       |        |                                   |
| deleteWordBackward               | `yes`  |                                   |
| deleteWordForward                | `yes`  |                                   |
| deleteSoftLineBackward           | `yes`  |                                   |
| deleteSoftLineForward            | `yes`  |                                   |
| deleteEntireSoftLine             |        |                                   |
| deleteHardLineBackward           |        |                                   |
| deleteHardLineForward            |        |                                   |
| deleteByDrag                     |        |                                   |
| deleteByCut                      | `yes`  |                                   |
| deleteContent                    |        |                                   |
| deleteContentBackward            | `yes`  |                                   |
| deleteContentForward             | `yes`  |                                   |
| historyUndo                      |        |                                   |
| historyRedo                      |        |                                   |
| formatBold                       |        |                                   |
| formatItalic                     |        |                                   |
| ~~formatUnderline~~              | `skip` |                                   |
| ~~formatStrikethrough~~          | `skip` | could support but keybind unknown |
| ~~formatSuperscript~~            | `skip` |                                   |
| ~~formatSubscript~~              | `skip` |                                   |
| ~~formatJustifyFull~~            | `skip` |                                   |
| ~~formatJustifyCenter~~          | `skip` |                                   |
| ~~formatJustifyRight~~           | `skip` |                                   |
| ~~formatJustifyLeft~~            | `skip` |                                   |
| formatIndent                     |        |                                   |
| formatOutdent                    |        |                                   |
| ~~formatRemove~~                 | `skip` |                                   |
| ~~formatSetBlockTextDirection~~  | `skip` |                                   |
| ~~formatSetInlineTextDirection~~ | `skip` |                                   |
| ~~formatBackColor~~              | `skip` |                                   |
| ~~formatFontColor~~              | `skip` |                                   |
| ~~formatFontName~~               | `skip` |                                   |

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
