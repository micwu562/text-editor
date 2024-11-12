# hiccup

custom text editor for project

### backlog

- [ ] css reset; essential css stuff (font-smoothing, etc)
- [ ] error handling
- [ ] custom text editor (not shadow textarea method)

### 10 / 10

- [ ] move cursor w/ mouse
- [ ] make selections

### design decisions

- display data separate from core data

  - i.e. display has array of chars that 'mirrors' core data
  - needed since when char deleted, still need to track
  - display should be told what transaction type happened
  - selection has to animate too
