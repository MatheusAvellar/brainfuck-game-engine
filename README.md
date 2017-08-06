# Brainfuck Game Engine

A work in progress game engine built to make use solely of the
[brainfuck](https://en.wikipedia.org/wiki/Brainfuck) language.


## Screenshots

Insert funny 'an image is worth a thousand words' joke here, or something.

<p align="center">
    <img src="http://i.imgur.com/tJHTYdF.png"/>
</p>
<p align="center">
    <img src="http://i.imgur.com/IuYT1Z3.png"/>
</p>


## Development

The game code is separated in two files: `load.bf` and `update.bf`.
The first is only run only once, as to load a state to the tape, while
the latter runs on every frame.


## User input

Whenever the interpreter finds a `,` (comma) in the code, it reads whatever
*value* is on the current cell and replaces it with the state of the 
corresponding input.

Valid values are listed below:

    0 = Left arrow             => (0 = unpressed, 1 = pressed)
    1 = Up arrow               => (0 = unpressed, 1 = pressed)
    2 = Right arrow            => (0 = unpressed, 1 = pressed)
    3 = Down arrow             => (0 = unpressed, 1 = pressed)
    4 = 'A' key                => (0 = unpressed, 1 = pressed)
    5 = 'S' key                => (0 = unpressed, 1 = pressed)
    6 = X coordinate of mouse  => (0 to 24)
    7 = Y coordinate of mouse  => (0 to 18)
    8 = Mouse click            => (0 = unpressed, 1 = pressed)


## Output

The 1st cell on the tape holds the value for the background color of the
canvas. Value to color equivalences are the listed below. Default (`0`)
is white.

The game screen is drawn according to the first *25 × 19 =* **475**
cells in the program tape after the first cell. They are equivalent to a grid
on the canvas, where each value corresponds to a color:

    0 = No change (shows the background color)
    1 = Black (#333)
    2 = Gray  (#ccc)
    3 = White (#fff)
    4 = Red   (#c33)
    5 = Green (#3c3)
    6 = Blue  (#33c)

Values wrap around, so a value of `7` would be equivalent to a `0` (background
color), a value of `8` would be equivalent to a `1` (black), and so on.


## Credits

As mentioned on the source code, full credits to **copy** for the initial code
for the compiler, available online at https://copy.sh/brainfuck/. I highly
recommend a visit to [copy's GitHub](https://github.com/copy/), everything is
awesome in there.

I will most likely finish replacing the compiler in the future with one fully
built by myself. However, for the moment, this should do nicely.
