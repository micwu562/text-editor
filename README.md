# hiccup

custom text editor for project

### 10 / 13

- [ ] ...

### 10 / 12

- [x] move cursor w/ mouse
- [x] make selections
- [x] navigate by word, line, etc (option/cmd + arrow keys)

### backlog

- [ ] css reset; essential css stuff (font-smoothing, etc)

### design decisions

- display data separate from core data

  - i.e. display has array of chars that 'mirrors' core data
  - needed since when char deleted, still need to track
  - display should be told what transaction type happened
  - selection has to animate too

- is no selection null selection or selection === cursor?

### reading list

`https://unicode.org/reports/tr29`

- uax 19. specifies how word breaks are determined.
- not implemented, for my own sanity.

`https://www.unicode.org/reports/tr14`

- uax 14. specifies line breaking algorithm
- `@todo`: handle hyphen breaks, and maybe more?
