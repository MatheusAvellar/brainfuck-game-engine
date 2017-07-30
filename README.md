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

**Note:** *not implemented yet.*


## User input

Keyboard input comes through the first 6 cells of the data tape.

0. Left arrow
1. Up arrow
2. Right arrow
3. Down arrow
4. 'A' key
5. 'S' key

I might try to figure out a way to do mouse input as well. We'll see.

**Note:** *not implemented yet. (this **was** implemented, but then I
purposely unimplemented it. Will reimplement it in the future)*


## Output

The 7th cell on the tape (`tape[6]`) holds the value for the
background color of the canvas. Value to color equivalences are
listed down below.

The game screen is drawn according to the first *25 × 19 =* **475**
cells in the program tape, after the 7 reserved cells. They are equivalent
to a grid on the canvas, where each value corresponds to a color:

            0 - No change (= background color)
            1 - Black
            2 - Black
    3 or more - Black, too, I haven't given much thought to this yet.

**Note:** *only partially implemented.*

## Credits

As mentioned on the source code, full credits to
[copy](https://github.com/copy/) for the code for the compiler, available
online at https://copy.sh/brainfuck/. I highly recommend a visit to *copy*'s
GitHub, everything is awesome in there.

I will most likely replace the compiler in the future with one I build myself.
However, for the moment, this should do nicely.
