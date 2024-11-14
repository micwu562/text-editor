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
| insertText                       | [x]   |                                   |
| ~~insertReplacementText~~        |       | ex. from spellchecker             |
| insertLineBreak                  | [x]   | `shift`+`enter`                   |
| insertParagraph                  | [x]   | `enter`                           |
| ~~insertOrderedList~~            |       | could support but keybind unknown |
| ~~insertUnorderedList~~          |       | could support but keybind unknown |
| ~~insertHorizontalRule~~         |       | could support but keybind unknown |
| insertFromYank                   | [ ]   |                                   |
| insertFromDrop                   | [ ]   |                                   |
| insertFromPaste                  | [ ]   | implemented but `text/plain` only |
| insertFromPasteAsQuotation       | [ ]   |                                   |
| insertTranspose                  | [ ]   |                                   |
| insertCompositionText            | [ ]   |                                   |
| insertLink                       | [ ]   |                                   |
| deleteWordBackward               | [x]   |                                   |
| deleteWordForward                | [x]   |                                   |
| deleteSoftLineBackward           | [x]   |                                   |
| deleteSoftLineForward            | [x]   |                                   |
| deleteEntireSoftLine             | [ ]   |                                   |
| deleteHardLineBackward           | [ ]   |                                   |
| deleteHardLineForward            | [ ]   |                                   |
| deleteByDrag                     | [ ]   |                                   |
| deleteByCut                      | [x]   |                                   |
| deleteContent                    | [ ]   |                                   |
| deleteContentBackward            | [x]   |                                   |
| deleteContentForward             | [x]   |                                   |
| historyUndo                      | [ ]   |                                   |
| historyRedo                      | [ ]   |                                   |
| formatBold                       | [ ]   |                                   |
| formatItalic                     | [ ]   |                                   |
| ~~formatUnderline~~              |       |                                   |
| ~~formatStrikethrough~~          |       | could support but keybind unknown |
| ~~formatSuperscript~~            |       |                                   |
| ~~formatSubscript~~              |       |                                   |
| ~~formatJustifyFull~~            |       |                                   |
| ~~formatJustifyCenter~~          |       |                                   |
| ~~formatJustifyRight~~           |       |                                   |
| ~~formatJustifyLeft~~            |       |                                   |
| formatIndent                     | [ ]   |                                   |
| formatOutdent                    | [ ]   |                                   |
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
