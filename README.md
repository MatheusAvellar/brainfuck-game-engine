# Brainfuck Game Engine

A work in progress game engine built to make use solely of the
[brainfuck](https://en.wikipedia.org/wiki/Brainfuck) language.

<p align="center">
    <img src="http://i.imgur.com/M5d0ySY.png"/>
</p>


## Development

The game code is separated in two files: `load.bf` and `update.bf`.
The first is only run only once, as to load a state to the tape, while
the latter runs on every frame.

*Note: not implemented yet.*


## User input

Keyboard input comes through the first 6 cells of the data tape.

1. Left arrow
2. Up arrow
3. Right arrow
4. Down arrow
5. 'A' key
6. 'S' key

I might try to figure out a way to do mouse input as well. We'll see.


## Output

The game itself. Yeah. I'm still fully working out how that's gonna
play out. Possibly a separate tape?

*Note: not implemented yet.*